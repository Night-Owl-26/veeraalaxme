import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Bundlers rewrite Leaflet's default marker image URLs incorrectly unless
// pointed at the actual bundled asset URLs explicitly — a well-known Leaflet
// + Vite/webpack gotcha.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// OpenStreetMap tiles via Leaflet — free, no API key, no billing.
export default function MapView({ lat, lng, label, height = "h-48" }) {
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
    <div className={`${height} rounded-2xl overflow-hidden`} role="img" aria-label={`Map showing ${label}`}>
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
