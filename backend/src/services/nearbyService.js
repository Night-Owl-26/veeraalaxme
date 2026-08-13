// Free OSM-based "nearby places" via the Overpass API — no key, no billing.
// One combined query per lookup (not five) to stay a light user of the
// shared public instance; results are classified back into categories
// client-side by inspecting each returned node's own OSM tags.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "VeeraaLaxmeVastu/1.0 (+https://veeralaxmevastu.com)";
const RADIUS_M = 5000;

const CATEGORY_FILTERS = [
  '["amenity"="school"]',
  '["amenity"="hospital"]',
  '["highway"="bus_stop"]',
  '["amenity"="bus_station"]',
  '["railway"="station"]',
  '["aeroway"="aerodrome"]',
];

const CATEGORY_MATCHERS = {
  school: (tags) => tags.amenity === "school",
  hospital: (tags) => tags.amenity === "hospital",
  bus: (tags) => tags.highway === "bus_stop" || tags.amenity === "bus_station",
  railway: (tags) => tags.railway === "station",
  airport: (tags) => tags.aeroway === "aerodrome",
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearby(lat, lng) {
  const nodeQueries = CATEGORY_FILTERS.map((f) => `node${f}(around:${RADIUS_M},${lat},${lng});`).join("\n");
  const query = `[out:json][timeout:15];(${nodeQueries});out body;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8", "User-Agent": USER_AGENT },
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass request failed (${res.status})`);
  const data = await res.json();
  const elements = data.elements || [];

  const nearest = {};
  for (const [key, matches] of Object.entries(CATEGORY_MATCHERS)) {
    let best = null;
    for (const el of elements) {
      if (!el.tags || !matches(el.tags) || el.lat == null || el.lon == null) continue;
      const d = haversineKm(lat, lng, el.lat, el.lon);
      if (best === null || d < best) best = d;
    }
    if (best !== null) nearest[key] = Math.round(best * 10) / 10;
  }
  return nearest;
}

module.exports = { findNearby };
