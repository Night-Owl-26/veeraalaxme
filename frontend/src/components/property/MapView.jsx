import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin, Maximize2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Bundlers rewrite Leaflet's default marker image URLs incorrectly unless
// pointed at the actual bundled asset URLs explicitly — a well-known Leaflet
// + Vite/webpack gotcha.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

function MapTiles({ lat, lng, label, zoom = 15, interactive = true }) {
  return (
    <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={interactive} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}

// OpenStreetMap tiles via Leaflet — free, no API key, no billing.
export default function MapView({ lat, lng, label, height = "h-48" }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  if (!lat || !lng) {
    return (
      <div className={`vc-card ${height} flex items-center justify-center`} style={{ background: "var(--surface)" }}>
        <div className="text-center px-4">
          <MapPin size={22} className="mx-auto mb-1" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Location not available for this listing</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${height} rounded-2xl overflow-hidden`} role="img" aria-label={`Map showing ${label}`}>
        <MapTiles lat={lat} lng={lng} label={label} interactive={false} />
        <button
          type="button" onClick={() => setExpanded(true)} aria-label="View full-size map"
          className="absolute top-2 right-2 z-[1000] p-2 rounded-lg shadow-sm"
          style={{ background: "var(--card)", border: "1px solid var(--line)" }}
        >
          <Maximize2 size={15} aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--card)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--line)" }}>
            <span className="text-sm font-semibold truncate pr-3">{label}</span>
            <button onClick={() => setExpanded(false)} aria-label="Close full-size map" className="p-1.5 rounded-full hover:bg-black/5 shrink-0">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <MapTiles lat={lat} lng={lng} label={label} interactive />
          </div>
        </div>
      )}
    </>
  );
}
