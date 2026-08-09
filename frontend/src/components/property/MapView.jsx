import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Loads the Google Maps JS SDK lazily and only if a key is configured.
// Without a key (e.g. local dev without one set up), this renders a clean
// fallback instead of a broken/blank map — the rest of the app stays usable.
export default function MapView({ lat, lng, label, height = "h-48" }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!MAPS_KEY || !lat || !lng) return;
    if (window.google?.maps) { setReady(true); return; }

    const existing = document.getElementById("gmaps-script");
    if (existing) { existing.addEventListener("load", () => setReady(true)); return; }

    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setFailed(true);
    document.head.appendChild(script);
  }, [lat, lng]);

  useEffect(() => {
    if (!ready || !ref.current || !window.google) return;
    const map = new window.google.maps.Map(ref.current, {
      center: { lat, lng }, zoom: 15, disableDefaultUI: true, zoomControl: true,
    });
    new window.google.maps.Marker({ position: { lat, lng }, map, title: label });
  }, [ready, lat, lng, label]);

  if (!MAPS_KEY || !lat || !lng || failed) {
    return (
      <div className={`vc-card ${height} flex items-center justify-center`} style={{ background: "var(--surface)" }}>
        <div className="text-center px-4">
          <MapPin size={22} className="mx-auto mb-1" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {!MAPS_KEY ? "Map unavailable — set VITE_GOOGLE_MAPS_API_KEY to enable it" : "Location not available for this listing"}
          </p>
        </div>
      </div>
    );
  }

  return <div ref={ref} className={`${height} rounded-2xl overflow-hidden`} role="img" aria-label={`Map showing ${label}`} />;
}
