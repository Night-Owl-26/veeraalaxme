import { useState } from "react";
import PropertyThumb from "../property/PropertyThumb";

const STATUS_STYLE = {
  APPROVED: { background: "var(--banyan-tint)", color: "var(--banyan)" },
  REJECTED: { background: "var(--brick-tint)", color: "var(--brick-dark)" },
  SOLD: { background: "var(--surface)", color: "var(--ink-muted)" },
  PENDING: { background: "var(--turmeric-tint)", color: "var(--ink)" },
};

export default function RecentListingRow({ property, onTakeDown, onReinstate }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="vc-card p-3">
      <div className="flex items-center gap-3">
        <PropertyThumb property={property} height="h-16" className="w-16 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm truncate">{property.title}</div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={STATUS_STYLE[property.status] || STATUS_STYLE.PENDING}>
              {property.status}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{property.locality}, {property.city} · {property.seller?.name}</div>
          {property.spamScore > 0 && <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--brick)" }}>Spam risk score: {property.spamScore}</div>}
          {property.possibleDuplicateOf && <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--brick)" }}>⚠ Photo matches another listing — possible duplicate</div>}
          {property.status === "REJECTED" && property.rejectionReason && (
            <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>Reason: {property.rejectionReason}</div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {property.status === "REJECTED" || property.status === "PENDING" ? (
            <button
              disabled={busy}
              onClick={async () => { setBusy(true); await onReinstate(property.id); setBusy(false); }}
              className="vc-btn-primary px-3 py-2 text-xs min-h-[40px]"
            >
              {property.status === "PENDING" ? "Approve" : "Reinstate"}
            </button>
          ) : (
            <button onClick={() => setRejecting((v) => !v)} className="vc-btn-ghost px-3 py-2 text-xs font-semibold min-h-[40px]">Take down</button>
          )}
        </div>
      </div>
      {rejecting && (
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
          <input className="vc-input" placeholder="Reason for taking this down" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button
            disabled={busy || !reason.trim()}
            onClick={async () => { setBusy(true); await onTakeDown(property.id, reason); setBusy(false); setRejecting(false); }}
            className="vc-btn-primary px-3 text-xs shrink-0"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
