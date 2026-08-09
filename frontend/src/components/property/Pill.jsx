export default function Pill({ children, tone = "neutral", icon: Icon }) {
  const map = {
    brick: { background: "var(--brick-tint)", color: "var(--brick-dark)" },
    banyan: { background: "var(--banyan-tint)", color: "var(--banyan)" },
    turmeric: { background: "var(--turmeric-tint)", color: "#8a6420" },
    neutral: { background: "var(--surface)", color: "var(--ink-soft)" },
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={map[tone]}>
      {Icon ? <Icon size={12} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
