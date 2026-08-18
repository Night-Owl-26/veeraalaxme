import { Home as HomeIcon, Building2, TreePine, Store, Warehouse, CheckCircle2 } from "lucide-react";
import { resolveMediaUrl } from "../../utils/format";

const TYPE_ICON = {
  "Residential Land": TreePine, "Agricultural Land": TreePine, "Commercial Land": TreePine,
  Villa: HomeIcon, House: HomeIcon, Apartment: Building2, "Farm House": HomeIcon,
  Office: Building2, Shop: Store, Warehouse: Warehouse,
};
const GRADIENTS = [["#B6472F", "#8F3620"], ["#2F5F4E", "#1F4237"], ["#C8933A", "#9C701F"], ["#1B1F2E", "#3A4258"]];

function gradientFor(id) {
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) hash = (hash * 31 + String(id).charCodeAt(i)) >>> 0;
  const s = GRADIENTS[hash % GRADIENTS.length];
  return `linear-gradient(135deg, ${s[0]}, ${s[1]})`;
}

export default function PropertyThumb({ property, className = "", height = "h-44", zoomOnHover = false }) {
  const Icon = TYPE_ICON[property.type] || HomeIcon;
  const imageUrl = property.images?.[0]?.url;

  return (
    <div className={`relative ${height} ${className} flex items-center justify-center overflow-hidden`} style={!imageUrl ? { background: gradientFor(property.id) } : undefined}>
      {imageUrl ? (
        <img
          src={resolveMediaUrl(imageUrl)} alt={property.title} loading="lazy"
          className={`w-full h-full object-cover ${zoomOnHover ? "transition-transform duration-300 group-hover:scale-105" : ""}`}
        />
      ) : (
        <Icon size={40} color="rgba(255,255,255,.85)" strokeWidth={1.5} aria-hidden="true" />
      )}
      <div className="absolute top-2 left-2">
        <span className="f-mono text-[10px] tracking-wide uppercase font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,.4)", color: "#fff" }}>
          {property.type}
        </span>
      </div>
      {property.documentsVerified && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 f-mono text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,.95)", color: "var(--banyan)" }}>
            <CheckCircle2 size={11} /> Verified
          </span>
        </div>
      )}
    </div>
  );
}
