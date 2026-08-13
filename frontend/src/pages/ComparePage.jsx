import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Scale, X } from "lucide-react";
import { propertiesApi } from "../api/properties";
import { useCompare } from "../context/CompareContext";
import PropertyThumb from "../components/property/PropertyThumb";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import { formatPrice } from "../utils/format";
import Seo from "../components/common/Seo";

const ROWS = [
  ["Price", (p) => formatPrice(p.price) + (p.priceUnit || "")],
  ["Type", (p) => p.type],
  ["Area", (p) => p.areaLabel],
  ["Location", (p) => `${p.locality}, ${p.city}`],
  ["Facing", (p) => p.vastu.facing + "-facing"],
  ["Vastu Score", (p) => p.vastu.score],
  ["Bedrooms", (p) => p.bedrooms || "—"],
  ["Water", (p) => (p.amenities.water ? "Yes" : "No")],
  ["Electricity", (p) => (p.amenities.electricity ? "Yes" : "No")],
  ["Seller", (p) => p.seller?.name || "—"],
];

export default function ComparePage() {
  const { compareIds, toggleCompare } = useCompare();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(compareIds.map((id) => propertiesApi.getById(id).then((d) => d.property).catch(() => null)))
      .then((results) => setItems(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [compareIds]);

  if (loading) return <Spinner label="Loading comparison…" />;

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <EmptyState icon={Scale} title="Nothing to compare yet" description="Tap the scale icon on up to three listings to line them up side by side." />
      </div>
    );
  }

  return (
    <div id="main-content">
      <Seo title="Compare properties" noindex />
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-5">Compare properties</h1>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th className="text-left p-2 w-32"></th>
              {items.map((p) => (
                <th key={p.id} className="p-2 align-top">
                  <div className="vc-card p-3 text-left relative">
                    <button onClick={() => toggleCompare(p.id)} aria-label="Remove from comparison" className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/5"><X size={13} /></button>
                    <PropertyThumb property={p} height="h-20" className="rounded-lg mb-2" />
                    <Link to={`/property/${p.slug || p.id}`} className="text-sm font-semibold text-left hover:underline block">{p.title}</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, fn]) => (
              <tr key={label} className="border-t" style={{ borderColor: "var(--line)" }}>
                <td className="p-2.5 text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>{label}</td>
                {items.map((p) => <td key={p.id} className="p-2.5 text-sm font-medium f-mono">{fn(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
