import { useState } from "react";
import { CheckCircle2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { vastuApi } from "../../api/vastu";

const CATEGORY_LABELS = {
  plot: "Plot", facing: "Facing", entrance: "Entrance", kitchen: "Kitchen",
  bedroom: "Bedroom", pooja: "Pooja Room", water: "Water", bathroom: "Bathroom",
  staircase: "Staircase", slope: "Slope",
};

// The analyze endpoints return { analysis, positiveFactors, areasToReview,
// hasSufficientData } directly. When re-loading a saved analysis by id, only
// `analysis` (with its stored firedRules) comes back — this derives the same
// shape client-side so VastuResult doesn't need two render paths.
export function deriveResultView(analysis) {
  const firedRules = analysis.firedRules || [];
  return {
    analysis,
    positiveFactors: firedRules.filter((r) => r.severity === "POSITIVE"),
    areasToReview: firedRules.filter((r) => r.severity !== "POSITIVE"),
    hasSufficientData: analysis.overallScore !== null && analysis.overallScore !== undefined,
  };
}

function scoreColor(score) {
  if (score >= 80) return "var(--banyan)";
  if (score >= 60) return "var(--turmeric)";
  return "var(--brick)";
}

export default function VastuResult({ result }) {
  const { analysis, positiveFactors, areasToReview, hasSufficientData } = result;
  const [aiText, setAiText] = useState(analysis.aiExplanation || null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const requestExplanation = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const { aiExplanation } = await vastuApi.explain(analysis.id);
      setAiText(aiExplanation);
    } catch (e) {
      setAiError(e.message || "AI explanation is unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!hasSufficientData) {
    return (
      <div className="vc-card p-6 text-center">
        <p className="font-semibold">Not enough data to score yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
          Fill in at least the facing and entrance direction to get a Vastu analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="vc-card p-5 sm:p-6 flex items-center gap-5 flex-wrap">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center f-mono text-2xl font-bold shrink-0"
          style={{ background: "var(--surface)", border: `3px solid ${scoreColor(analysis.overallScore)}`, color: scoreColor(analysis.overallScore) }}
        >
          {analysis.overallScore}
        </div>
        <div>
          <div className="vc-eyebrow mb-1">Overall Vastu Score</div>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            {analysis.overallScore >= 80
              ? "Excellent alignment with traditional Vastu principles."
              : analysis.overallScore >= 60
              ? "A workable layout with a few areas worth reviewing."
              : "Several traditional Vastu concerns — see recommendations below."}
          </p>
        </div>
      </div>

      <div className="vc-card p-5 sm:p-6">
        <div className="vc-eyebrow mb-3">Category Breakdown</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(analysis.categoryScores).map(([cat, score]) => (
            <div key={cat} className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>{CATEGORY_LABELS[cat] || cat}</div>
              <div className="f-mono text-lg font-bold mt-0.5" style={{ color: scoreColor(score) }}>{score}</div>
            </div>
          ))}
        </div>
      </div>

      {positiveFactors.length > 0 && (
        <div className="vc-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} style={{ color: "var(--banyan)" }} aria-hidden="true" />
            <div className="vc-eyebrow" style={{ color: "var(--banyan)" }}>Positive Factors</div>
          </div>
          <ul className="space-y-2.5">
            {positiveFactors.map((f) => (
              <li key={f.ruleId} className="text-sm">
                <span className="font-semibold">{CATEGORY_LABELS[f.category] || f.category}:</span>{" "}
                <span style={{ color: "var(--ink-soft)" }}>{f.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {areasToReview.length > 0 && (
        <div className="vc-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "var(--brick)" }} aria-hidden="true" />
            <div className="vc-eyebrow" style={{ color: "var(--brick)" }}>Areas to Review</div>
          </div>
          <ul className="space-y-3">
            {areasToReview.map((f) => (
              <li key={f.ruleId} className="text-sm">
                <div>
                  <span className="font-semibold">{CATEGORY_LABELS[f.category] || f.category}:</span>{" "}
                  <span style={{ color: "var(--ink-soft)" }}>{f.explanation}</span>
                </div>
                <div className="text-xs mt-1 font-medium" style={{ color: "var(--brick-dark)" }}>{f.recommendation}</div>
                {f.confidence === "LOW" && (
                  <div className="text-[11px] mt-1" style={{ color: "var(--ink-muted)" }}>Traditions vary on this point — treat as a discussion point, not a fixed rule.</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="vc-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="vc-eyebrow">AI Explanation</div>
          {!aiText && (
            <button onClick={requestExplanation} disabled={aiLoading} className="vc-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5">
              {aiLoading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />}
              {aiLoading ? "Writing…" : "Explain in plain English"}
            </button>
          )}
        </div>
        {aiText ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{aiText}</p>
        ) : aiError ? (
          <p className="text-sm" style={{ color: "var(--brick)" }}>{aiError}</p>
        ) : (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>Get a plain-English summary of the findings above, grounded in this exact analysis.</p>
        )}
      </div>

      <p className="text-xs px-1" style={{ color: "var(--ink-muted)" }}>
        Vastu analysis is based on traditional Vastu Shastra principles and is provided for informational purposes only.
        It is not architectural, engineering, legal, financial, or guaranteed property advice, and does not guarantee
        wealth, health, or any specific outcome.
      </p>
    </div>
  );
}
