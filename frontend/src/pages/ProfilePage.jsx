import { useEffect, useState } from "react";
import { ShieldCheck, TrendingUp, Eye, MessageSquare, Bookmark, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import { propertiesApi } from "../api/properties";
import { initials } from "../utils/format";
import Spinner from "../components/common/Spinner";
import Seo from "../components/common/Seo";

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [savedCount, setSavedCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === "BUYER") {
      propertiesApi.saved().then((d) => setSavedCount(d.items.length)).finally(() => setLoading(false));
    } else {
      usersApi.sellerStats().then(setStats).finally(() => setLoading(false));
    }
  }, [user.role]);

  return (
    <div id="main-content" className="max-w-xl mx-auto">
      <Seo title="My profile" noindex />
      <div className="vc-card p-6 text-center mb-5">
        <span
          className="w-20 h-20 rounded-full flex items-center justify-center f-mono text-xl font-bold mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, var(--turmeric), var(--brick))", color: "#fff" }}
        >
          {initials(user.name)}
        </span>
        <h1 className="f-display text-xl font-semibold">{user.name}</h1>
        <p className="text-xs font-semibold capitalize mt-1" style={{ color: "var(--brick)" }}>{user.role.toLowerCase()}</p>

        <div className="flex flex-col items-center gap-1 mt-4 text-sm" style={{ color: "var(--ink-soft)" }}>
          <div className="flex items-center gap-1.5">
            <Phone size={13} style={{ color: "var(--ink-muted)" }} aria-hidden="true" /> {user.phone}
          </div>
          {user.email && (
            <div className="flex items-center gap-1.5">
              <Mail size={13} style={{ color: "var(--ink-muted)" }} aria-hidden="true" /> {user.email}
              {user.emailVerified && <CheckCircle2 size={13} style={{ color: "var(--banyan)" }} aria-label="Email verified" />}
            </div>
          )}
        </div>

        {user.isVerifiedSeller && (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--banyan-tint)", color: "var(--banyan)" }}>
            <ShieldCheck size={13} /> Verified seller
          </span>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading…" />
      ) : user.role === "BUYER" ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Bookmark} label="Saved Listings" value={savedCount ?? 0} />
        </div>
      ) : (
        stats && (
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
      <span className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5" style={{ background: "var(--brick-tint)" }}>
        <Icon size={16} style={{ color: "var(--brick)" }} aria-hidden="true" />
      </span>
      <div className="text-xl font-bold f-mono">{value}</div>
      <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}
