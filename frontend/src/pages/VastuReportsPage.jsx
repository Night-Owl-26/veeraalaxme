import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FileClock, Mountain, Home as HomeIcon } from "lucide-react";
import { vastuApi } from "../api/vastu";
import VastuResult, { deriveResultView } from "../components/vastu/VastuResult";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";

export default function VastuReportsPage() {
  const { id } = useParams();
  return id ? <ReportDetail id={id} /> : <ReportList />;
}

function ReportList() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    vastuApi.myAnalyses()
      .then((d) => { if (!cancelled) setItems(d.items); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <div className="vc-eyebrow mb-2">Vastu Advisor</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-6">Your Vastu reports</h1>

      {error && <div className="vc-card p-4 text-sm" style={{ borderColor: "var(--brick)", color: "var(--brick-dark)" }}>{error}</div>}
      {!items && !error && <Spinner label="Loading your reports…" />}
      {items && items.length === 0 && (
        <EmptyState icon={FileClock} title="No analyses yet" description="Run a Land or Home Vastu analysis and it'll show up here." />
      )}
      {items && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((a) => (
            <Link key={a.id} to={`/vastu/reports/${a.id}`} className="vc-card p-4 flex items-center gap-3 hover:border-[var(--brick)] transition-colors" style={{ borderWidth: 1.5 }}>
              {a.type === "LAND" ? <Mountain size={18} style={{ color: "var(--ink-muted)" }} aria-hidden="true" /> : <HomeIcon size={18} style={{ color: "var(--ink-muted)" }} aria-hidden="true" />}
              <div className="flex-1">
                <div className="font-semibold text-sm">{a.type === "LAND" ? "Land Vastu" : "Home Vastu"} analysis</div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{new Date(a.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
              </div>
              {a.overallScore !== null && (
                <div className="f-mono text-lg font-bold" style={{ color: a.overallScore >= 80 ? "var(--banyan)" : a.overallScore >= 60 ? "var(--turmeric)" : "var(--brick)" }}>
                  {a.overallScore}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportDetail({ id }) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    vastuApi.getAnalysis(id)
      .then((d) => { if (!cancelled) setAnalysis(d.analysis); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <button onClick={() => navigate("/vastu/reports")} className="vc-btn-ghost text-sm px-3 py-2 mb-4">← All reports</button>
      {error && <div className="vc-card p-4 text-sm" style={{ borderColor: "var(--brick)", color: "var(--brick-dark)" }}>{error}</div>}
      {!analysis && !error && <Spinner label="Loading report…" />}
      {analysis && (
        <>
          <h1 className="f-display text-2xl font-semibold mb-4">{analysis.type === "LAND" ? "Land Vastu Analysis" : "Home Vastu Analysis"}</h1>
          <VastuResult result={deriveResultView(analysis)} />
        </>
      )}
    </div>
  );
}
