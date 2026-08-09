import { useState } from "react";
import VastuCompass from "../components/vastu/VastuCompass";
import VastuResult from "../components/vastu/VastuResult";
import { vastuApi } from "../api/vastu";

const COMPASS_FIELDS = [
  { key: "facing", label: "Plot Facing", allowCenter: false },
  { key: "entranceDir", label: "Entrance", allowCenter: false },
  { key: "slopeDir", label: "Slope (downward direction)", allowCenter: false },
  { key: "waterDir", label: "Borewell / Water Source", allowCenter: true },
  { key: "septicDir", label: "Septic Tank", allowCenter: true },
];

const PLOT_SHAPES = [
  { value: "SQUARE", label: "Square" },
  { value: "RECTANGLE", label: "Rectangle" },
  { value: "L_SHAPED", label: "L-shaped" },
  { value: "TRIANGULAR", label: "Triangular" },
  { value: "IRREGULAR", label: "Irregular" },
];

export default function LandVastuPage() {
  const [activeField, setActiveField] = useState("facing");
  const [draft, setDraft] = useState({ cornerPlot: false, compoundWall: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...draft };
      if (payload.plotLength) payload.plotLength = Number(payload.plotLength);
      if (payload.plotWidth) payload.plotWidth = Number(payload.plotWidth);
      if (payload.roadWidth) payload.roadWidth = Number(payload.roadWidth);
      const data = await vastuApi.analyzeLand(payload);
      setResult(data);
    } catch (e) {
      setError(e.message || "Couldn't run the analysis right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div id="main-content" className="max-w-2xl mx-auto pb-8">
        <button onClick={() => setResult(null)} className="vc-btn-ghost text-sm px-3 py-2 mb-4">← Analyze another plot</button>
        <h1 className="f-display text-2xl font-semibold mb-4">Land Vastu Analysis</h1>
        <VastuResult result={result} />
      </div>
    );
  }

  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <div className="vc-eyebrow mb-2">Land Vastu</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-1">Analyze your plot</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>Fill in what you know — every field is optional, and the score reflects only the fields you provide.</p>

      <div className="vc-card p-5 sm:p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>Select what you're setting, then tap a direction on the compass</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {COMPASS_FIELDS.map((f) => (
              <button
                key={f.key} onClick={() => setActiveField(f.key)}
                className={`vc-chip ${activeField === f.key ? "active" : ""}`}
              >
                {f.label}{draft[f.key] ? ` · ${draft[f.key]}` : ""}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <VastuCompass
              value={draft[activeField]}
              onChange={(v) => set({ [activeField]: v })}
              allowCenter={COMPASS_FIELDS.find((f) => f.key === activeField)?.allowCenter}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          <Field label="Plot Length (ft)"><input className="vc-input" type="number" min="1" value={draft.plotLength || ""} onChange={(e) => set({ plotLength: e.target.value })} /></Field>
          <Field label="Plot Width (ft)"><input className="vc-input" type="number" min="1" value={draft.plotWidth || ""} onChange={(e) => set({ plotWidth: e.target.value })} /></Field>
        </div>

        <Field label="Plot Shape">
          <select className="vc-input" value={draft.plotShape || ""} onChange={(e) => set({ plotShape: e.target.value || undefined })}>
            <option value="">Select shape</option>
            {PLOT_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>

        <Field label="Road Width (ft, informational only)">
          <input className="vc-input" type="number" min="1" value={draft.roadWidth || ""} onChange={(e) => set({ roadWidth: e.target.value })} />
        </Field>

        <div className="flex gap-5 flex-wrap">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={!!draft.cornerPlot} onChange={(e) => set({ cornerPlot: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Corner plot
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={!!draft.compoundWall} onChange={(e) => set({ compoundWall: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Compound wall present
          </label>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--brick)" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="vc-btn-primary w-full py-2.5 text-sm min-h-[44px]">
          {submitting ? "Analyzing…" : "Analyze this plot"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>{label}</div>
      {children}
    </div>
  );
}
