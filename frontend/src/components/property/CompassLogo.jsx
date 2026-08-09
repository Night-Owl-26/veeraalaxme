export default function CompassLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--brick)" strokeWidth="1.5" />
      <path d="M16 4 L19 16 L16 28 L13 16 Z" fill="var(--brick)" />
      <path d="M4 16 L16 13 L28 16 L16 19 Z" fill="var(--turmeric)" />
      <circle cx="16" cy="16" r="2" fill="var(--ink)" />
    </svg>
  );
}
