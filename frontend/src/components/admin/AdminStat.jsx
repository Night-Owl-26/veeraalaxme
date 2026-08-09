export default function AdminStat({ label, value, icon: Icon, tone, mono }) {
  const toneColor = tone === "turmeric" ? "var(--turmeric)" : tone === "banyan" ? "var(--banyan)" : "var(--brick)";
  return (
    <div className="vc-card p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} color={toneColor} aria-hidden="true" />
        <span className="text-[11px] font-semibold" style={{ color: "var(--ink-muted)" }}>{label}</span>
      </div>
      <div className={`text-xl font-bold ${mono ? "f-mono" : "f-display"}`}>{value}</div>
    </div>
  );
}
