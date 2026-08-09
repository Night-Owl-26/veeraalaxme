export default function FormField({ label, htmlFor, error, children, hint }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--ink-soft)" }}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] mt-1" style={{ color: "var(--ink-muted)" }}>{hint}</p>}
      {error && (
        <p role="alert" className="text-[11px] mt-1 font-medium" style={{ color: "var(--brick)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
