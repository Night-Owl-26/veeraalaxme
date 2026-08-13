import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Bookmark, MapPin, ChevronDown } from "lucide-react";
import { propertiesApi } from "../../api/properties";
import { usePropertyActions } from "../../hooks/usePropertyActions";
import PropertyThumb from "./PropertyThumb";
import VastuGauge from "./VastuGauge";
import { formatPrice } from "../../utils/format";

// Instagram-Reels-style vertical scroll-snap feed of other listings, shown
// below a property's own detail view so browsing continues in place instead
// of dead-ending at "back to listings". Each slide is its own full-height
// card; tapping one navigates to that property's detail page, which renders
// its own reel of further listings — the "keep scrolling" chain the request
// asked for is achieved through that link, not a single infinite-scroll blob.
export default function PropertyReels({ excludeId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggleLike, toggleSave } = usePropertyActions();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    propertiesApi.list({ excludeId, pageSize: 10, sort: "newest" })
      .then((d) => { if (!cancelled) setItems(d.items); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [excludeId]);

  const applyLocal = (id, patch) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if ("_liked" in patch) next.likes = p.likes + (patch._liked ? 1 : -1);
        return next;
      })
    );
  };

  if (loading || items.length === 0) return null;

  return (
    <div>
      <div className="vc-eyebrow mb-3">More listings for you</div>
      <div
        className="rounded-2xl"
        style={{ scrollSnapType: "y mandatory", overflowY: "auto", maxHeight: "78vh" }}
      >
        {items.map((p, i) => (
          <div
            key={p.id}
            className="relative rounded-2xl overflow-hidden mb-3 last:mb-0"
            style={{ scrollSnapAlign: "start", height: "72vh" }}
          >
            <Link to={`/property/${p.slug || p.id}`} className="absolute inset-0 block">
              <PropertyThumb property={p} height="h-full" className="w-full h-full" />
            </Link>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.8) 100%)" }}
            />

            {i === 0 && (
              <div
                className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full pointer-events-none"
                style={{ background: "rgba(0,0,0,.45)", color: "#fff" }}
              >
                <ChevronDown size={14} aria-hidden="true" /> Scroll for more
              </div>
            )}

            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4">
              <button
                onClick={(e) => { e.preventDefault(); toggleLike(p.id, applyLocal); }}
                aria-pressed={p._liked} aria-label={p._liked ? "Unlike" : "Like"}
                className="flex flex-col items-center gap-1"
              >
                <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.45)" }}>
                  <Heart size={20} fill={p._liked ? "var(--brick)" : "none"} color={p._liked ? "var(--brick)" : "#fff"} aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold" style={{ color: "#fff" }}>{p.likes}</span>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); toggleSave(p.id, applyLocal); }}
                aria-pressed={p._saved} aria-label={p._saved ? "Remove from saved" : "Save"}
                className="flex flex-col items-center gap-1"
              >
                <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,.45)" }}>
                  <Bookmark size={20} fill={p._saved ? "var(--turmeric)" : "none"} color={p._saved ? "var(--turmeric)" : "#fff"} aria-hidden="true" />
                </span>
              </button>
            </div>

            <Link to={`/property/${p.slug || p.id}`} className="absolute left-0 right-0 bottom-0 p-4 pr-16 block">
              <div className="flex items-center gap-2 mb-1.5">
                <VastuGauge score={p.vastu.score} facing={p.vastu.facing} size={36} />
                <span className="f-mono text-xl font-bold" style={{ color: "#fff" }}>
                  {formatPrice(p.price)}{p.priceUnit || ""}
                </span>
              </div>
              <div className="font-semibold leading-snug" style={{ color: "#fff" }}>{p.title}</div>
              <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: "rgba(255,255,255,.85)" }}>
                <MapPin size={13} aria-hidden="true" /> {p.locality}, {p.city}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
