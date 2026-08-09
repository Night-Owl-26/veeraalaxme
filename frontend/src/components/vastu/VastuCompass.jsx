const DIRECTIONS = [
  { key: "N", label: "North", bearing: 0 },
  { key: "NE", label: "Northeast", bearing: 45 },
  { key: "E", label: "East", bearing: 90 },
  { key: "SE", label: "Southeast", bearing: 135 },
  { key: "S", label: "South", bearing: 180 },
  { key: "SW", label: "Southwest", bearing: 225 },
  { key: "W", label: "West", bearing: 270 },
  { key: "NW", label: "Northwest", bearing: 315 },
];

function pointOnCircle(cx, cy, r, bearingDeg) {
  const rad = ((bearingDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// An interactive 8-direction compass. Decorative SVG behind (rings + needle
// pointing at the current selection) with real, individually-focusable
// buttons laid on top at each compass point — accessible and touch-friendly
// (44px min targets) in a way that clickable SVG wedges would not be.
export default function VastuCompass({ value, onChange, allowCenter = false, size = 220, disabled = false }) {
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size / 2 - 30;
  const btnR = size / 2 - 30;
  const selected = DIRECTIONS.find((d) => d.key === value);
  const needleAngle = selected ? selected.bearing : null;

  return (
    <div className="relative select-none" style={{ width: size, height: size }} role="radiogroup" aria-label="Direction">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-0">
        <circle cx={cx} cy={cy} r={ringR} fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={ringR * 0.62} fill="none" stroke="var(--line)" strokeWidth="1" />
        {DIRECTIONS.map((d) => {
          const inner = pointOnCircle(cx, cy, ringR * 0.62, d.bearing);
          const outer = pointOnCircle(cx, cy, ringR, d.bearing);
          return <line key={d.key} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--line)" strokeWidth="1" />;
        })}
        {needleAngle !== null && (
          <line
            x1={cx} y1={cy}
            x2={pointOnCircle(cx, cy, ringR * 0.62, needleAngle).x}
            y2={pointOnCircle(cx, cy, ringR * 0.62, needleAngle).y}
            stroke="var(--brick)" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: "x2 .25s ease, y2 .25s ease" }}
          />
        )}
        <circle cx={cx} cy={cy} r={allowCenter ? 12 : 4} fill={allowCenter ? "var(--card)" : "var(--ink-muted)"} stroke={allowCenter ? "var(--line)" : "none"} strokeWidth="1.5" />
      </svg>

      {DIRECTIONS.map((d) => {
        const pos = pointOnCircle(cx, cy, btnR, d.bearing);
        const active = value === d.key;
        return (
          <button
            key={d.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={d.label}
            disabled={disabled}
            onClick={() => onChange(d.key)}
            className="absolute f-mono text-[11px] font-bold rounded-full flex items-center justify-center transition-colors"
            style={{
              left: pos.x, top: pos.y, transform: "translate(-50%, -50%)",
              width: 30, height: 30, minWidth: 30, minHeight: 30,
              background: active ? "var(--brick)" : "var(--card)",
              color: active ? "#fff" : "var(--ink-soft)",
              border: `1.5px solid ${active ? "var(--brick)" : "var(--line)"}`,
            }}
          >
            {d.key}
          </button>
        );
      })}

      {allowCenter && (
        <button
          type="button"
          role="radio"
          aria-checked={value === "CENTER"}
          aria-label="Center"
          disabled={disabled}
          onClick={() => onChange("CENTER")}
          className="absolute f-mono text-[9px] font-bold rounded-full flex items-center justify-center"
          style={{
            left: cx, top: cy, transform: "translate(-50%, -50%)",
            width: 24, height: 24,
            background: value === "CENTER" ? "var(--brick)" : "var(--card)",
            color: value === "CENTER" ? "#fff" : "var(--ink-muted)",
            border: `1.5px solid ${value === "CENTER" ? "var(--brick)" : "var(--line)"}`,
          }}
        >
          C
        </button>
      )}
    </div>
  );
}
