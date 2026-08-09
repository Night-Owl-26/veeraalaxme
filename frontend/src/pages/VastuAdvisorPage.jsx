import { Link } from "react-router-dom";
import { Mountain, Home as HomeIcon, FileClock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function VastuAdvisorPage() {
  const { user } = useAuth();

  return (
    <div id="main-content" className="max-w-3xl mx-auto pb-8">
      <div className="vc-eyebrow mb-2">Vastu Advisor</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-2">Analyze your land or home</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
        Enter a few details and get a structured Vastu score, category breakdown, and recommendations —
        computed by a rule engine, not guessed by AI.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/vastu/land" className="vc-card p-6 block hover:border-[var(--brick)] transition-colors" style={{ borderWidth: 1.5 }}>
          <Mountain size={26} style={{ color: "var(--brick)" }} aria-hidden="true" />
          <div className="font-semibold mt-3">Land Vastu</div>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
            For an open plot — facing, entrance, shape, slope, and water placement.
          </p>
        </Link>
        <Link to="/vastu/home" className="vc-card p-6 block hover:border-[var(--brick)] transition-colors" style={{ borderWidth: 1.5 }}>
          <HomeIcon size={26} style={{ color: "var(--brick)" }} aria-hidden="true" />
          <div className="font-semibold mt-3">Home Vastu</div>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
            For a built home — kitchen, bedrooms, pooja room, staircase, and more.
          </p>
        </Link>
      </div>

      {user && (
        <Link to="/vastu/reports" className="vc-card p-4 mt-4 flex items-center gap-3 hover:border-[var(--brick)] transition-colors" style={{ borderWidth: 1.5 }}>
          <FileClock size={18} style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
          <div>
            <div className="font-semibold text-sm">Your Vastu reports</div>
            <div className="text-xs" style={{ color: "var(--ink-muted)" }}>Revisit analyses you've run before.</div>
          </div>
        </Link>
      )}

      <p className="text-xs mt-6 px-1" style={{ color: "var(--ink-muted)" }}>
        Vastu analysis is based on traditional Vastu Shastra principles and is provided for informational purposes
        only. It should not be treated as architectural, engineering, legal, financial, or guaranteed property advice.
      </p>
    </div>
  );
}
