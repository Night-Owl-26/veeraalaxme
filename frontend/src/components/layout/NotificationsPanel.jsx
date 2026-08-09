import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { notificationsApi } from "../../api/notifications";
import { timeAgo } from "../../utils/format";

const ICONS = { LIKE: Heart, COMMENT: MessageCircle, MESSAGE: MessageCircle, APPROVAL: CheckCircle2, REJECTION: XCircle, SYSTEM: Info };

export default function NotificationsPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    notificationsApi.list().then((d) => setItems(d.items)).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await notificationsApi.markRead(id); } catch {}
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 max-w-[92vw] vc-card shadow-xl overflow-hidden z-50" role="dialog" aria-label="Notifications">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
        <span className="vc-eyebrow">Notifications</span>
        {items.some((n) => !n.read) && (
          <button
            onClick={async () => { setItems((p) => p.map((n) => ({ ...n, read: true }))); try { await notificationsApi.markAllRead(); } catch {} }}
            className="text-xs font-semibold" style={{ color: "var(--brick)" }}
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading && <div className="p-4 text-sm text-center" style={{ color: "var(--ink-muted)" }}>Loading…</div>}
        {!loading && items.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--ink-muted)" }}>You're all caught up.</div>}
        {items.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <Link
              key={n.id} to={n.link || "#"} onClick={() => { handleRead(n.id); onClose(); }}
              className="flex gap-2.5 px-4 py-3 text-sm border-t hover:bg-black/[.02]"
              style={{ borderColor: "var(--line)", background: n.read ? "transparent" : "var(--brick-tint)" }}
            >
              <Icon size={15} className="mt-0.5 shrink-0" style={{ color: "var(--brick)" }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="leading-snug">{n.message}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{timeAgo(n.createdAt)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
