export default function PropertyCardSkeleton() {
  return (
    <div className="vc-card overflow-hidden animate-pulse" aria-hidden="true">
      <div className="h-44" style={{ background: "var(--line)" }} />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded" style={{ background: "var(--line)", width: "80%" }} />
        <div className="h-3 rounded" style={{ background: "var(--line)", width: "50%" }} />
        <div className="h-5 rounded" style={{ background: "var(--line)", width: "40%" }} />
        <div className="h-3 rounded" style={{ background: "var(--line)", width: "60%" }} />
      </div>
    </div>
  );
}
