import { useState } from "react";
import PropertyThumb from "../property/PropertyThumb";

export default function PendingRow({ property, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="vc-card p-3">
      <div className="flex items-center gap-3">
        <PropertyThumb property={property} height="h-16" className="w-16 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{property.title}</div>
          <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{property.locality}, {property.city} · {property.seller?.name}</div>
          {property.spamScore > 0 && <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--brick)" }}>Spam risk score: {property.spamScore}</div>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setRejecting((v) => !v)} className="vc-btn-ghost px-3 py-2 text-xs font-semibold min-h-[40px]">Reject</button>
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); await onApprove(property.id); setBusy(false); }}
            className="vc-btn-primary px-3 py-2 text-xs min-h-[40px]"
          >
            Approve
          </button>
        </div>
      </div>
      {rejecting && (
        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
          <input className="vc-input" placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button
            disabled={busy || !reason.trim()}
            onClick={async () => { setBusy(true); await onReject(property.id, reason); setBusy(false); setRejecting(false); }}
            className="vc-btn-primary px-3 text-xs shrink-0"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
