import { X } from "lucide-react";

export const PROPERTY_TYPES = ["Residential Land", "Agricultural Land", "Commercial Land", "Villa", "House", "Apartment", "Farm House", "Office", "Shop", "Warehouse"];
export const DEFAULT_FILTERS = { types: [], maxPrice: 25000000, minVastu: 0, verifiedOnly: false, city: "" };

export default function FilterPanel({ open, onClose, filters, setFilters, cities }) {
  if (!open) return null;
  const toggleType = (t) => setFilters((f) => ({ ...f, types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t] }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(27,31,46,.45)" }} onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Filters"
        className="w-full sm:w-96 h-full bg-white overflow-y-auto p-5 animate-[slideIn_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="f-display text-xl font-semibold">Filters</h3>
          <button onClick={onClose} aria-label="Close filters" className="p-2 -m-2 rounded-full hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="mb-5">
          <div className="vc-eyebrow mb-2">City</div>
          <select className="vc-input" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}>
            <option value="">All cities</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="mb-5">
          <div className="vc-eyebrow mb-2">Property Type</div>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => (
              <button key={t} onClick={() => toggleType(t)} className={`vc-chip ${filters.types.includes(t) ? "active" : ""}`} aria-pressed={filters.types.includes(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="budget-range" className="vc-eyebrow mb-2 block">Budget up to {(filters.maxPrice / 100000).toFixed(0)} L</label>
          <input id="budget-range" type="range" min="500000" max="25000000" step="500000" value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
            className="w-full" style={{ accentColor: "var(--brick)" }} />
        </div>

        <div className="mb-5">
          <label htmlFor="vastu-range" className="vc-eyebrow mb-2 block">Minimum Vastu Score: {filters.minVastu}</label>
          <input id="vastu-range" type="range" min="0" max="95" step="5" value={filters.minVastu}
            onChange={(e) => setFilters((f) => ({ ...f, minVastu: Number(e.target.value) }))}
            className="w-full" style={{ accentColor: "var(--banyan)" }} />
        </div>

        <label className="flex items-center gap-2 mb-6 text-sm font-medium">
          <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))} style={{ accentColor: "var(--brick)" }} />
          Verified sellers only
        </label>

        <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
          <button onClick={() => setFilters(DEFAULT_FILTERS)} className="vc-btn-ghost flex-1 py-3 text-sm font-semibold">Reset</button>
          <button onClick={onClose} className="vc-btn-primary flex-1 py-3 text-sm">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
