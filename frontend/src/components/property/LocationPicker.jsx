import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Search, MapPin } from "lucide-react";
import { geoApi } from "../../api/geo";
import { useDebounce } from "../../hooks/useDebounce";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const CHENNAI = [13.0827, 80.2707];

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Free OSM-based location picker: search an address (Nominatim, proxied
// through our backend) or click the map directly to drop a pin.
export default function LocationPicker({ lat, lng, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    geoApi.search(debouncedQuery)
      .then((d) => { if (!cancelled) setResults(d.results); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const pick = (nlat, nlng) => {
    onChange(nlat, nlng);
    setResults([]);
  };

  const center = lat && lng ? [lat, lng] : CHENNAI;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
        <input
          className="vc-input pl-9"
          placeholder="Search an address or locality…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {results.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 mt-1 vc-card max-h-56 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i} type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-black/5 flex items-start gap-2"
                onClick={() => pick(r.lat, r.lng)}
              >
                <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        )}
        {searching && <p className="text-[11px] mt-1" style={{ color: "var(--ink-muted)" }}>Searching…</p>}
      </div>

      <div className="h-56 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <MapContainer center={center} zoom={lat && lng ? 15 : 11} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={pick} />
          {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
        {lat && lng ? `Pin set at ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Search an address above or click the map to set the exact location."}
      </p>
    </div>
  );
}
