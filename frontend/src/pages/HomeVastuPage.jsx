import { useState } from "react";
import VastuCompass from "../components/vastu/VastuCompass";
import VastuResult from "../components/vastu/VastuResult";
import { vastuApi } from "../api/vastu";

const COMPASS_FIELDS = [
  { key: "facing", label: "House Facing", allowCenter: false },
  { key: "entranceDir", label: "Main Entrance", allowCenter: false },
  { key: "kitchenDir", label: "Kitchen", allowCenter: false },
  { key: "masterBedroomDir", label: "Master Bedroom", allowCenter: false },
  { key: "poojaDir", label: "Pooja Room", allowCenter: false },
  { key: "staircaseDir", label: "Staircase", allowCenter: true },
  { key: "bathroomDir", label: "Bathroom / Toilet", allowCenter: true },
  { key: "waterDir", label: "Water Tank / Borewell", allowCenter: true },
  { key: "septicDir", label: "Septic Tank", allowCenter: true },
  { key: "parkingDir", label: "Parking", allowCenter: false },
];

export default function HomeVastuPage() {
  const [activeField, setActiveField] = useState("facing");
  const [draft, setDraft] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...draft };
      if (payload.bedrooms) payload.bedrooms = Number(payload.bedrooms);
      if (payload.bathrooms) payload.bathrooms = Number(payload.bathrooms);
      const data = await vastuApi.analyzeHome(payload);
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
        <button onClick={() => setResult(null)} className="vc-btn-ghost text-sm px-3 py-2 mb-4">← Analyze another home</button>
        <h1 className="f-display text-2xl font-semibold mb-4">Home Vastu Analysis</h1>
        <VastuResult result={result} />
      </div>
    );
  }

  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <div className="vc-eyebrow mb-2">Home Vastu</div>
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-1">Analyze your home</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>Fill in what you know — every field is optional, and the score reflects only the rooms you provide.</p>

      <div className="vc-card p-5 sm:p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>Select a room, then tap a direction on the compass</div>
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
          <Field label="Bedrooms"><input className="vc-input" type="number" min="0" value={draft.bedrooms || ""} onChange={(e) => set({ bedrooms: e.target.value })} /></Field>
          <Field label="Bathrooms"><input className="vc-input" type="number" min="0" value={draft.bathrooms || ""} onChange={(e) => set({ bathrooms: e.target.value })} /></Field>
        </div>

        {error && <p className="text-sm" style={{ color: "var(--brick)" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="vc-btn-primary w-full py-2.5 text-sm min-h-[44px]">
          {submitting ? "Analyzing…" : "Analyze this home"}
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
