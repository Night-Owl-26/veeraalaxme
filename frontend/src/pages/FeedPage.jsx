import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, Compass, Phone } from "lucide-react";
import { propertiesApi } from "../api/properties";
import PropertyCard from "../components/property/PropertyCard";
import PropertyCardSkeleton from "../components/property/PropertyCardSkeleton";
import FilterPanel, { DEFAULT_FILTERS } from "../components/property/FilterPanel";
import EmptyState from "../components/common/EmptyState";
import { useCompare } from "../context/CompareContext";
import { usePropertyActions } from "../hooks/usePropertyActions";
import { useDebounce } from "../hooks/useDebounce";
import Seo, { SITE_NAME } from "../components/common/Seo";

export default function FeedPage({ mode = "all" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const debouncedQ = useDebounce(q, 350);

  const { compareIds, toggleCompare } = useCompare();
  const { toggleLike, toggleSave } = usePropertyActions();

  const cities = useMemo(() => [...new Set(items.map((p) => p.city))], [items]);

  const applyLocal = (id, patch) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...patch };
        if ("_liked" in patch) next.likes = p.likes + (patch._liked ? 1 : -1);
        return next;
      })
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (mode === "saved") {
          const d = await propertiesApi.saved();
          if (!cancelled) setItems(d.items);
        } else if (mode === "mine") {
          const d = await propertiesApi.mine();
          if (!cancelled) setItems(d.items);
        } else {
          const d = await propertiesApi.list({
            q: debouncedQ, city: filters.city, types: filters.types,
            maxPrice: filters.maxPrice, minVastu: filters.minVastu, verifiedOnly: filters.verifiedOnly,
            pageSize: 24,
          });
          if (!cancelled) setItems(d.items);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [mode, debouncedQ, filters]);

  useEffect(() => {
    if (mode !== "all") return;
    const next = new URLSearchParams(searchParams);
    if (debouncedQ) next.set("q", debouncedQ); else next.delete("q");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, mode]);

  const heading = mode === "saved" ? "Your saved listings" : mode === "mine" ? "My listings" : "Discover verified properties";
  const sub =
    mode === "saved" ? "Everything you've bookmarked, in one place." :
    mode === "mine" ? "Listings you've posted — published immediately, visible to everyone." :
    "Every seller verifies their email to post. Green checkmarks mean documents were verified too.";

  return (
    <div id="main-content">
      {mode === "all" ? (
        <Seo
          title="Buy & Sell Land and Property in Chennai, Vastu-Checked"
          description="Browse verified land, plots, apartments and villas for sale in Chennai. Every VeeraaLaxme Vastu listing carries a Vastu compatibility score, verified seller, and direct chat — search by locality, price, and Vastu facing."
          path="/"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: typeof window !== "undefined" ? window.location.origin : "",
            potentialAction: {
              "@type": "SearchAction",
              target: `${typeof window !== "undefined" ? window.location.origin : ""}/?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
      ) : (
        <Seo title={heading} noindex />
      )}

      <div className="flex items-end justify-between gap-4 mb-4 sm:mb-5 flex-wrap">
        <div>
          <h1 className="f-display text-2xl sm:text-3xl font-semibold">{heading}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>{sub}</p>
        </div>
      </div>

      {mode === "all" && (
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
            <input className="vc-input pl-9" placeholder="Search by locality or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings" />
          </div>
          <button onClick={() => setShowFilters(true)} className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold shrink-0">
            <SlidersHorizontal size={14} aria-hidden="true" /> <span className="hidden sm:inline">Filters</span>
            {(filters.types.length > 0 || filters.city || filters.minVastu > 0 || filters.verifiedOnly) && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brick)" }} />
            )}
          </button>
        </div>
      )}

      {mode === "all" && (
        <div className="vc-card p-5 mb-4 sm:mb-5 flex items-center justify-between gap-4 flex-wrap" style={{ background: "var(--ink)" }}>
          <div className="flex items-center gap-3">
            <Compass size={24} style={{ color: "var(--turmeric)" }} aria-hidden="true" />
            <div>
              <div className="font-semibold" style={{ color: "#fff" }}>Vastu Check</div>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.65)" }}>Talk to our Vastu consultant about your land or home — no listing required.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/vastu" className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(255,255,255,.25)", color: "#fff" }}>
              <Phone size={13} aria-hidden="true" /> Contact
            </Link>
          </div>
        </div>
      )}

      {mode === "all" && filters.types.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.types.map((t) => (
            <button key={t} onClick={() => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) }))} className="vc-chip active flex items-center gap-1">
              {t} ×
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="vc-card p-4 mb-4 text-sm" style={{ borderColor: "var(--brick)", color: "var(--brick-dark)" }}>{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No listings match yet"
          description={
            mode === "saved" ? "Tap the bookmark icon on any listing to save it here." :
            mode === "mine" ? "Post a property to see it listed here." :
            "Try widening your filters or searching a nearby locality."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {items.map((p) => (
            <PropertyCard
              key={p.id} property={p} saved={p._saved} liked={p._liked}
              onToggleSave={(id) => toggleSave(id, applyLocal)} onToggleLike={(id) => toggleLike(id, applyLocal)}
              onToggleCompare={toggleCompare} inCompare={compareIds.includes(p.id)}
              showStatus={mode === "mine"}
            />
          ))}
        </div>
      )}

      <FilterPanel open={showFilters} onClose={() => setShowFilters(false)} filters={filters} setFilters={setFilters} cities={cities} />
    </div>
  );
}
