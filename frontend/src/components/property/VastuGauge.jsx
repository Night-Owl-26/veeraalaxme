export default function VastuGauge({ score, facing, size = 84 }) {
  const r = size / 2 - 9;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const dirAngles = { N: -90, E: 0, S: 90, W: 180 };
  const angle = dirAngles[facing] ?? -90;
  const rad = (angle * Math.PI) / 180;
  const nx = c + (r - 2) * Math.cos(rad);
  const ny = c + (r - 2) * Math.sin(rad);
  const color = score >= 80 ? "var(--banyan)" : score >= 60 ? "var(--turmeric)" : "var(--brick)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Vastu score ${score} out of 100, facing ${facing}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
      <circle
        cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={c} y={11} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--ink-muted)">N</text>
      <text x={size - 6} y={c + 3} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--ink-muted)">E</text>
      <text x={c} y={size - 3} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--ink-muted)">S</text>
      <text x={6} y={c + 3} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="var(--ink-muted)">W</text>
      <circle cx={nx} cy={ny} r="4" fill={color} />
      <text x={c} y={c + 5} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="17" fontWeight="700" fill="var(--ink)">{score}</text>
    </svg>
  );
}
