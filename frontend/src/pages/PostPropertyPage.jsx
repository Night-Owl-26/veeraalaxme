import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { propertiesApi } from "../api/properties";
import { aiApi } from "../api/ai";
import { useToast } from "../context/ToastContext";
import VastuGauge from "../components/property/VastuGauge";
import LocationPicker from "../components/property/LocationPicker";
import Modal from "../components/common/Modal";
import { PROPERTY_TYPES } from "../components/property/FilterPanel";
import { formatPrice } from "../utils/format";
import { propertyDraftSchema, validate } from "../utils/validation";
import Seo from "../components/common/Seo";

const BLANK = {
  title: "", type: "Villa", price: "", negotiable: true, city: "", locality: "", areaLabel: "",
  bedrooms: "", bathrooms: "", facing: "N", kitchenDir: "S", entranceDir: "N", poojaRoom: false,
  water: true, electricity: true, compoundWall: true, road: "", description: "", surveyNumber: "",
  ownership: "Freehold", loanAvailable: true, website: "", // website = honeypot
  latitude: null, longitude: null,
};

function computeVastuScorePreview({ facing, kitchenDir, poojaRoom, water }) {
  const base = { N: 85, E: 90, S: 60, W: 65 }[facing] ?? 70;
  let score = base;
  if (poojaRoom) score += 5;
  if (kitchenDir === "S") score += 4; else score -= 2;
  if (water) score += 2;
  return Math.max(40, Math.min(98, Math.round(score)));
}

export default function PostPropertyPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(null); // holds the created property once published
  const totalSteps = 6;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const previewScore = computeVastuScorePreview(draft);

  const generateDescription = async () => {
    setAiLoading(true); setAiError(null);
    try {
      const { text } = await aiApi.propertyDescription({
        title: draft.title, type: draft.type, city: draft.city, locality: draft.locality, areaLabel: draft.areaLabel, facing: draft.facing,
      });
      set({ description: text });
    } catch (e) {
      setAiError(e.message || "Couldn't generate a description right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const onPickImages = (e) => {
    const files = [...e.target.files].slice(0, 20 - images.length);
    setImages((prev) => [...prev, ...files]);
  };

  const canNext = () => {
    if (step === 1) return draft.title.trim().length >= 5 && draft.price;
    if (step === 2) return draft.city.trim() && draft.locality.trim() && draft.areaLabel.trim();
    if (step === 5) return draft.description.trim().length >= 10;
    return true;
  };

  // Which step each schema field lives on, so a validation failure sends the
  // user back to where they can actually see and fix it — previously this
  // always jumped to step 1, which only renders title/price errors, so a
  // failure on any other field (most commonly description) looked like the
  // form had silently reset with nothing wrong.
  const FIELD_STEP = { title: 1, price: 1, city: 2, locality: 2, areaLabel: 2, description: 5 };

  const handleSubmit = async () => {
    const { valid, errors: fieldErrors } = validate(propertyDraftSchema, {
      title: draft.title, price: Number(draft.price), city: draft.city, locality: draft.locality,
      areaLabel: draft.areaLabel, description: draft.description,
    });
    if (!valid) {
      setErrors(fieldErrors);
      const firstBadField = Object.keys(fieldErrors)[0];
      setStep(FIELD_STEP[firstBadField] || 1);
      showToast(fieldErrors[firstBadField] || "Please check the highlighted fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: draft.title, type: draft.type, price: Number(draft.price), negotiable: draft.negotiable,
        city: draft.city, locality: draft.locality, areaLabel: draft.areaLabel,
        bedrooms: draft.bedrooms ? Number(draft.bedrooms) : undefined, bathrooms: draft.bathrooms ? Number(draft.bathrooms) : undefined,
        facing: draft.facing, kitchenDir: draft.kitchenDir, entranceDir: draft.entranceDir, poojaRoom: draft.poojaRoom,
        water: draft.water, electricity: draft.electricity, compoundWall: draft.compoundWall, road: draft.road || undefined,
        latitude: draft.latitude ?? undefined, longitude: draft.longitude ?? undefined,
        description: draft.description, surveyNumber: draft.surveyNumber || undefined, ownership: draft.ownership,
        loanAvailable: draft.loanAvailable, website: draft.website,
      };
      const { property } = await propertiesApi.create(payload);
      if (images.length) {
        try { await propertiesApi.uploadImages(property.id, images); } catch (e) { showToast("Listing saved, but photo upload failed — add them from My Listings", "error"); }
      }
      setPublished(property);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="main-content" className="max-w-2xl mx-auto pb-8">
      <Seo title="Post a property" noindex />
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-1">Post a property</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>Your listing goes live immediately after posting.</p>

      <div className="flex items-center gap-1.5 mb-6" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i < step ? "var(--brick)" : "var(--line)" }} />
        ))}
      </div>

      <div className="vc-card p-5 sm:p-6">
        {/* Honeypot: real users never see or fill this. Bots that auto-fill every field will, and the backend silently rejects it. */}
        <input type="text" name="website" value={draft.website} onChange={(e) => set({ website: e.target.value })} className="vc-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {step === 1 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 1 · Basic Info</div>
            <Field label="Property Title" error={errors.title}>
              <input className={`vc-input ${errors.title ? "invalid" : ""}`} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. 3BHK Villa with Private Garden" />
            </Field>
            <Field label="Property Type">
              <select className="vc-input" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Price (₹)" error={errors.price}>
              <input className={`vc-input ${errors.price ? "invalid" : ""}`} type="number" min="1" value={draft.price} onChange={(e) => set({ price: e.target.value })} placeholder="e.g. 8500000" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={draft.negotiable} onChange={(e) => set({ negotiable: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Price is negotiable
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 2 · Location & Land Details</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.city}><input className={`vc-input ${errors.city ? "invalid" : ""}`} value={draft.city} onChange={(e) => set({ city: e.target.value })} placeholder="Chennai" /></Field>
              <Field label="Locality" error={errors.locality}><input className={`vc-input ${errors.locality ? "invalid" : ""}`} value={draft.locality} onChange={(e) => set({ locality: e.target.value })} placeholder="Anna Nagar" /></Field>
            </div>
            <Field label="Area (e.g. 2400 sqft or 2 acres)" error={errors.areaLabel}><input className={`vc-input ${errors.areaLabel ? "invalid" : ""}`} value={draft.areaLabel} onChange={(e) => set({ areaLabel: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bedrooms (optional)"><input className="vc-input" type="number" min="0" value={draft.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} /></Field>
              <Field label="Bathrooms (optional)"><input className="vc-input" type="number" min="0" value={draft.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} /></Field>
            </div>
            <Field label="Road Width / Access"><input className="vc-input" value={draft.road} onChange={(e) => set({ road: e.target.value })} placeholder="30 ft" /></Field>
            <Field label="Map location (optional, but powers the map & nearby places on the listing)">
              <LocationPicker lat={draft.latitude} lng={draft.longitude} onChange={(lat, lng) => set({ latitude: lat, longitude: lng })} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 3 · Vastu & Facing</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Facing"><DirSelect value={draft.facing} onChange={(v) => set({ facing: v })} /></Field>
              <Field label="Kitchen"><DirSelect value={draft.kitchenDir} onChange={(v) => set({ kitchenDir: v })} /></Field>
              <Field label="Entrance"><DirSelect value={draft.entranceDir} onChange={(v) => set({ entranceDir: v })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={draft.poojaRoom} onChange={(e) => set({ poojaRoom: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Has a pooja room
            </label>
            <div className="vc-card p-4 flex items-center gap-4" style={{ background: "var(--surface)" }}>
              <VastuGauge score={previewScore} facing={draft.facing} size={72} />
              <div>
                <div className="text-xs" style={{ color: "var(--ink-muted)" }}>Live preview</div>
                <div className="font-semibold text-sm">This is how your Vastu score will look to buyers.</div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 4 · Amenities</div>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.water} onChange={(e) => set({ water: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Water available</label>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.electricity} onChange={(e) => set({ electricity: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Electricity connected</label>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.compoundWall} onChange={(e) => set({ compoundWall: e.target.checked })} style={{ accentColor: "var(--brick)" }} /> Compound wall</label>
            </div>
            <Field label="Ownership">
              <select className="vc-input" value={draft.ownership} onChange={(e) => set({ ownership: e.target.value })}>
                <option>Freehold</option><option>Leasehold</option>
              </select>
            </Field>
            <Field label="Survey Number (kept private — shown only as a masked reference to verified buyers)">
              <input className="vc-input" value={draft.surveyNumber} onChange={(e) => set({ surveyNumber: e.target.value })} placeholder="Optional" />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 5 · Photos & Description</div>
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>Photos</div>
              <label className="vc-btn-ghost flex items-center justify-center gap-2 py-6 text-sm font-semibold cursor-pointer border-dashed">
                <ImagePlus size={18} aria-hidden="true" /> Add photos (JPEG/PNG/WEBP, up to 20)
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPickImages} className="hidden" />
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {images.map((f, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border" style={{ borderColor: "var(--line)" }}>
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove photo" className="absolute top-0.5 right-0.5 rounded-full p-0.5" style={{ background: "rgba(0,0,0,.6)" }}>
                        <X size={11} color="#fff" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>Description</span>
                <button onClick={generateDescription} disabled={aiLoading} className="vc-btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1.5">
                  {aiLoading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />} {aiLoading ? "Writing…" : "Generate with AI"}
                </button>
              </div>
              <textarea className={`vc-input ${errors.description ? "invalid" : ""}`} rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe the property, or generate a draft with AI above." />
              {errors.description ? (
                <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--brick)" }}>{errors.description}</p>
              ) : (
                <p className="text-[11px] mt-1" style={{ color: draft.description.trim().length >= 10 ? "var(--ink-muted)" : "var(--brick)" }}>
                  {draft.description.trim().length >= 10 ? "Looks good." : `At least 10 characters needed to continue (${draft.description.trim().length}/10).`}
                </p>
              )}
              {aiError && <p className="text-xs mt-1" style={{ color: "var(--brick)" }}>{aiError}</p>}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="vc-eyebrow">Step 6 · Review & Submit</div>
            <div className="vc-card p-4" style={{ background: "var(--surface)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{draft.title || "Untitled property"}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>{draft.locality}, {draft.city} · {draft.areaLabel}</div>
                </div>
                <VastuGauge score={previewScore} facing={draft.facing} size={56} />
              </div>
              <div className="f-mono text-lg font-bold mt-2" style={{ color: "var(--brick-dark)" }}>{draft.price ? formatPrice(Number(draft.price)) : "₹—"}</div>
              <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>{draft.description || "No description added yet."}</p>
              {images.length > 0 && <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>{images.length} photo(s) attached</p>}
            </div>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>By submitting, you confirm the details above are accurate. An admin will review this listing before it goes live.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-5 border-t" style={{ borderColor: "var(--line)" }}>
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="vc-btn-ghost px-4 py-2.5 text-sm font-semibold disabled:opacity-40 min-h-[44px]">Back</button>
          {step < totalSteps ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="vc-btn-primary px-5 py-2.5 text-sm min-h-[44px]">Continue</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="vc-btn-primary px-5 py-2.5 text-sm min-h-[44px]">{submitting ? "Publishing…" : "Publish listing"}</button>
          )}
        </div>
      </div>

      {published && (
        <Modal title="Listing published" onClose={() => navigate("/my-listings")}>
          <div className="text-center py-2">
            <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: "var(--banyan)" }} aria-hidden="true" />
            <p className="font-semibold text-lg mb-1">Your listing is live</p>
            <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>
              "{published.title}" is published and already showing in the feed for everyone to see.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate(`/property/${published.slug || published.id}`)} className="vc-btn-primary w-full py-3 text-sm">
                View my listing
              </button>
              <button
                onClick={() => { setPublished(null); setDraft(BLANK); setImages([]); setStep(1); }}
                className="vc-btn-ghost w-full py-3 text-sm font-semibold"
              >
                Post another property
              </button>
              <button onClick={() => navigate("/my-listings")} className="w-full text-center text-xs font-semibold mt-1" style={{ color: "var(--ink-muted)" }}>
                Go to My Listings
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-soft)" }}>{label}</div>
      {children}
      {error && <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--brick)" }}>{error}</p>}
    </div>
  );
}
function DirSelect({ value, onChange }) {
  return (
    <select className="vc-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {["N", "E", "S", "W"].map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  );
}
