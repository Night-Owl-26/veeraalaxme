import { useEffect, useState } from "react";
import { Building2, SlidersHorizontal, ShieldCheck, TrendingUp } from "lucide-react";
import { adminApi } from "../api/admin";
import { useToast } from "../context/ToastContext";
import AdminStat from "../components/admin/AdminStat";
import RecentListingRow from "../components/admin/RecentListingRow";
import CategoryBars from "../components/admin/CategoryBars";
import UserDirectory from "../components/admin/UserDirectory";
import Spinner from "../components/common/Spinner";
import Seo from "../components/common/Seo";

export default function AdminPage() {
  const { showToast } = useToast();
  const [recent, setRecent] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a, u] = await Promise.all([adminApi.listRecent(), adminApi.analytics(), adminApi.listUsers()]);
      setRecent(p.items);
      setAnalytics(a);
      setUsers(u.items);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = (id, patch) => {
    setRecent((items) => items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const takeDown = async (id, reason) => {
    try {
      await adminApi.reject(id, reason);
      updateStatus(id, { status: "REJECTED", rejectionReason: reason });
      showToast("Listing taken down");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const reinstate = async (id) => {
    try {
      await adminApi.approve(id);
      updateStatus(id, { status: "APPROVED", rejectionReason: null });
      showToast("Listing reinstated");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const updateUser = (id, patch) => {
    setUsers((items) => items.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const setBlacklist = async (id, blacklisted) => {
    try {
      await adminApi.setBlacklist(id, blacklisted);
      updateUser(id, { isBlacklisted: blacklisted });
      showToast(blacklisted ? "User blacklisted" : "User removed from blacklist");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const setVerifiedSeller = async (id, verified) => {
    try {
      await adminApi.verifySeller(id, verified);
      updateUser(id, { isVerifiedSeller: verified });
      showToast(verified ? "Seller verified" : "Verified badge removed");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div id="main-content">
      <Seo title="Admin dashboard" noindex />
      <h1 className="f-display text-2xl sm:text-3xl font-semibold mb-1">Admin dashboard</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-muted)" }}>Sellers publish listings directly — keep an eye on new activity here.</p>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <AdminStat label="Total Listings" value={analytics.totalListings} icon={Building2} />
          <AdminStat label="New Listings (7d)" value={analytics.newListings7d} icon={SlidersHorizontal} tone="turmeric" />
          <AdminStat label="Verified Sellers" value={analytics.verifiedSellers} icon={ShieldCheck} tone="banyan" />
          <AdminStat label="Revenue (30d)" value={`₹${(analytics.revenueLast30Days / 100).toLocaleString("en-IN")}`} icon={TrendingUp} mono />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="vc-eyebrow mb-3">Recent listings</div>
          {recent.length === 0 ? (
            <div className="vc-card p-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>No listings yet.</div>
          ) : (
            <div className="space-y-3">
              {recent.map((p) => <RecentListingRow key={p.id} property={p} onTakeDown={takeDown} onReinstate={reinstate} />)}
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

      <div className="mt-8">
        <div className="vc-eyebrow mb-3">Users ({users.length})</div>
        <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
          Contact details are visible to admins only, for support and fraud investigation.
        </p>
        {users.length === 0 ? (
          <div className="vc-card p-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>No users yet.</div>
        ) : (
          <div className="vc-card p-4">
            <UserDirectory users={users} onSetBlacklist={setBlacklist} onSetVerifiedSeller={setVerifiedSeller} />
          </div>
        )}
      </div>
    </div>
  );
}
