import { initials } from "../../utils/format";

export default function ThreadList({ threads, activeId, onSelect }) {
  return (
    <div role="listbox" aria-label="Conversations" className="h-full overflow-y-auto">
      {threads.map((t) => (
        <button
          key={t.id} role="option" aria-selected={t.id === activeId} onClick={() => onSelect(t.id)}
          className="w-full flex items-center gap-2.5 p-3 text-left min-h-[56px]"
          style={{ background: t.id === activeId ? "var(--brick-tint)" : "transparent" }}
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center f-mono text-[11px] font-bold shrink-0" style={{ background: "var(--banyan-tint)", color: "var(--banyan)" }}>
            {initials(t.otherUser.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{t.otherUser.name}</div>
            {t.lastMessage && <div className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>{t.lastMessage.text}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}
