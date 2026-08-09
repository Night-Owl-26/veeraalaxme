import { Link } from "react-router-dom";
import { Heart, Bookmark, MessageCircle, Scale, MapPin, ShieldCheck } from "lucide-react";
import PropertyThumb from "./PropertyThumb";
import VastuGauge from "./VastuGauge";
import Pill from "./Pill";
import { formatPrice, initials } from "../../utils/format";

export default function PropertyCard({ property, saved, liked, onToggleSave, onToggleLike, onToggleCompare, inCompare, showStatus }) {
  return (
    <article className="vc-card overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      <Link to={`/property/${property.id}`} className="block focus-visible:outline-none">
        <PropertyThumb property={property} />
      </Link>
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/property/${property.id}`} className="text-left min-w-0">
            <h3 className="font-semibold text-[15px] leading-snug hover:underline line-clamp-2">{property.title}</h3>
          </Link>
          <VastuGauge score={property.vastu.score} facing={property.vastu.facing} size={44} />
        </div>

        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--ink-muted)" }}>
          <MapPin size={12} aria-hidden="true" /> {property.locality}, {property.city}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="f-mono text-lg font-bold" style={{ color: "var(--brick-dark)" }}>
            {formatPrice(property.price)}{property.priceUnit || ""}
          </span>
          {property.negotiable && <Pill tone="neutral">Negotiable</Pill>}
          {showStatus && property.status !== "APPROVED" && (
            <Pill tone={property.status === "PENDING" ? "turmeric" : "brick"}>
              {property.status === "PENDING" ? "Pending Review" : "Rejected"}
            </Pill>
          )}
        </div>

        <div className="text-xs f-mono" style={{ color: "var(--ink-muted)" }}>
          {property.areaLabel} · {property.vastu.facing}-facing
          {property.bedrooms ? ` · ${property.bedrooms} BHK` : ""}
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto border-t" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-0.5">
            <button onClick={() => onToggleLike(property.id)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className="p-2 -m-1 rounded-full hover:bg-black/5 flex items-center gap-1 min-w-[44px] min-h-[44px] justify-center">
              <Heart size={16} fill={liked ? "var(--brick)" : "none"} color={liked ? "var(--brick)" : "var(--ink-soft)"} aria-hidden="true" />
              <span className="text-xs f-mono">{property.likes}</span>
            </button>
            <Link to={`/property/${property.id}`} aria-label="View comments" className="p-2 -m-1 rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <MessageCircle size={16} color="var(--ink-soft)" aria-hidden="true" />
            </Link>
            <button onClick={() => onToggleCompare(property.id)} aria-pressed={inCompare} aria-label="Add to compare" className="p-2 -m-1 rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Scale size={16} color={inCompare ? "var(--brick)" : "var(--ink-soft)"} aria-hidden="true" />
            </button>
          </div>
          <button onClick={() => onToggleSave(property.id)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save"} className="p-2 -m-1 rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Bookmark size={16} fill={saved ? "var(--turmeric)" : "none"} color={saved ? "var(--turmeric)" : "var(--ink-soft)"} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: "var(--ink-muted)" }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center f-mono text-[9px] font-bold shrink-0" style={{ background: "var(--banyan-tint)", color: "var(--banyan)" }}>
            {initials(property.seller?.name)}
          </span>
          <span className="truncate">{property.seller?.name}</span>
          {property.seller?.verified && <ShieldCheck size={12} style={{ color: "var(--banyan)" }} aria-label="Verified seller" />}
        </div>
      </div>
    </article>
  );
}
