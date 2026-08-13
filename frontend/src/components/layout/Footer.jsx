import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 text-center">
      <div className="flex items-center justify-center gap-4 mb-3 text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>
        <Link to="/about" className="hover:underline">About</Link>
        <Link to="/contact" className="hover:underline">Contact</Link>
        <Link to="/vastu" className="hover:underline">Vastu Check</Link>
      </div>
      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
        VeeraaLaxme Vastu · Vastu scores and AI insights are illustrative, not professional advice.
      </p>
    </footer>
  );
}
