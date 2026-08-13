// Free OSM-based geocoding (Nominatim) — no API key, no billing, but its
// usage policy caps requests at 1/second app-wide (not per-user) and
// requires a descriptive User-Agent identifying the application.
const USER_AGENT = "VeeraaLaxmeVastu/1.0 (+https://veeralaxmevastu.com)";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Serializes every outgoing Nominatim call behind a shared queue so
// concurrent users across the whole app never burst past 1 request/second,
// which is a hard requirement of Nominatim's public-instance usage policy.
let lastCallAt = 0;
let queue = Promise.resolve();

function throttled(fn) {
  const next = queue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return fn();
  });
  queue = next.catch(() => {}); // one failed lookup shouldn't jam the queue for everyone else
  return next;
}

async function geocodeSearch(query) {
  return throttled(async () => {
    const url = `${NOMINATIM_BASE}/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);
    const data = await res.json();
    return data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
  });
}

module.exports = { geocodeSearch, USER_AGENT, NOMINATIM_BASE };
