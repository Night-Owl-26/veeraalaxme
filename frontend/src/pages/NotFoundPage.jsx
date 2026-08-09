import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <Compass size={36} className="mx-auto mb-4" style={{ color: "var(--ink-muted)" }} />
      <h1 className="f-display text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-sm mb-5" style={{ color: "var(--ink-muted)" }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="vc-btn-primary inline-block px-5 py-2.5 text-sm">Back to feed</Link>
    </div>
  );
}
