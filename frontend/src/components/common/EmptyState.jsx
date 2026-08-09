export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="vc-card p-10 text-center">
      {Icon && <Icon size={30} className="mx-auto mb-3" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />}
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>{description}</p>}
    </div>
  );
}
