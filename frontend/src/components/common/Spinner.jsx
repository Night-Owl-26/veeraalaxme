import { Loader2 } from "lucide-react";

export default function Spinner({ label = "Loading…", size = 22 }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-2 py-10">
      <Loader2 size={size} className="animate-spin" style={{ color: "var(--brick)" }} aria-hidden="true" />
      <span className="text-sm f-mono" style={{ color: "var(--ink-muted)" }}>{label}</span>
    </div>
  );
}
