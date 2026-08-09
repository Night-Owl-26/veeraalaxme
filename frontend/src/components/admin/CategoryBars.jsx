export default function CategoryBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) return <p className="text-sm" style={{ color: "var(--ink-muted)" }}>No approved listings yet.</p>;
  return (
    <div className="space-y-3">
      {data.map(({ type, count }) => (
        <div key={type}>
          <div className="flex justify-between text-xs mb-1"><span className="font-medium">{type}</span><span className="f-mono">{count}</span></div>
          <div className="h-2 rounded-full" style={{ background: "var(--line)" }}>
            <div className="h-2 rounded-full transition-[width] duration-500" style={{ width: `${(count / max) * 100}%`, background: "var(--brick)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
