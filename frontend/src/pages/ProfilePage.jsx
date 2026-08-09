import { useEffect, useState } from "react";
import { ShieldCheck, TrendingUp, Eye, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import { initials } from "../utils/format";
import Spinner from "../components/common/Spinner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(user.role !== "BUYER");

  useEffect(() => {
    if (user.role === "BUYER") return;
    usersApi.sellerStats().then(setStats).finally(() => setLoading(false));
  }, [user.role]);

  return (
    <div id="main-content" className="max-w-xl mx-auto">
      <div className="vc-card p-6 text-center mb-5">
        <span className="w-16 h-16 rounded-full flex items-center justify-center f-mono text-lg font-bold mx-auto mb-3" style={{ background: "var(--turmeric)", color: "var(--ink)" }}>
          {initials(user.name)}
        </span>
        <h1 className="f-display text-xl font-semibold">{user.name}</h1>
        <p className="text-sm capitalize" style={{ color: "var(--ink-muted)" }}>{user.role.toLowerCase()} · {user.phone}</p>
        {user.isVerifiedSeller && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: "var(--banyan)" }}>
            <ShieldCheck size={13} /> Verified seller
          </span>
        )}
      </div>

      {user.role !== "BUYER" && (
        loading ? <Spinner label="Loading stats…" /> : stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={TrendingUp} label="Total Listings" value={stats.total} />
            <StatCard icon={Eye} label="Total Views" value={stats.totalViews} />
            <StatCard icon={MessageSquare} label="Comments Received" value={stats.totalComments} />
            <StatCard icon={ShieldCheck} label="Approved" value={stats.approved} />
          </div>
        )
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="vc-card p-4">
      <Icon size={16} style={{ color: "var(--brick)" }} className="mb-2" />
      <div className="text-xl font-bold f-mono">{value}</div>
      <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}
