import { useEffect, useState } from "react";
import { Building2, SlidersHorizontal, ShieldCheck, TrendingUp } from "lucide-react";
import { adminApi } from "../api/admin";
import { useToast } from "../context/ToastContext";
import AdminStat from "../components/admin/AdminStat";
import PendingRow from "../components/admin/PendingRow";
import CategoryBars from "../components/admin/CategoryBars";
import Spinner from "../components/common/Spinner";

export default function AdminPage() {
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([adminApi.listPending(), adminApi.analytics()]);
      setPending(p.items);
      setAnalytics(a);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (id) => {
    try {
      await adminApi.approve(id);
      setPending((p) => p.filter((x) => x.id !== id));
      showToast("Listing approved");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const reject = async (id, reason) => {
    try {
      await adminApi.reject(id, reason);
      setPending((p) => p.filter((x) => x.id !== id));
      showToast("Listing rejected");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div id="main-content">
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-1">Admin dashboard</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>Review listings and keep an eye on platform activity.</p>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <AdminStat label="Total Listings" value={analytics.totalListings} icon={Building2} />
          <AdminStat label="Pending Review" value={analytics.pending} icon={SlidersHorizontal} tone="turmeric" />
          <AdminStat label="Verified Sellers" value={analytics.verifiedSellers} icon={ShieldCheck} tone="banyan" />
          <AdminStat label="Revenue (30d)" value={`₹${(analytics.revenueLast30Days / 100).toLocaleString("en-IN")}`} icon={TrendingUp} mono />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="vc-eyebrow mb-3">Pending approval ({pending.length})</div>
          {pending.length === 0 ? (
            <div className="vc-card p-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>No listings waiting for review.</div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => <PendingRow key={p.id} property={p} onApprove={approve} onReject={reject} />)}
            </div>
          )}
        </div>

        <div>
          <div className="vc-eyebrow mb-3">Listings by category</div>
          <div className="vc-card p-4">
            <CategoryBars data={analytics?.byType || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
