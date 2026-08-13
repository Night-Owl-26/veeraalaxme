import { useState } from "react";
import { ShieldCheck, ShieldOff, Ban, CheckCircle2 } from "lucide-react";

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function UserDirectory({ users, onSetBlacklist, onSetVerifiedSeller }) {
  const [busyId, setBusyId] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table className="w-full border-collapse min-w-[820px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
            <th className="py-2 pr-3 font-semibold">User</th>
            <th className="py-2 pr-3 font-semibold">Phone</th>
            <th className="py-2 pr-3 font-semibold">Email</th>
            <th className="py-2 pr-3 font-semibold">Role</th>
            <th className="py-2 pr-3 font-semibold">Listings</th>
            <th className="py-2 pr-3 font-semibold">Joined</th>
            <th className="py-2 pr-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t text-sm" style={{ borderColor: "var(--line)" }}>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center f-mono text-[11px] font-bold shrink-0" style={{ background: "var(--banyan-tint)", color: "var(--banyan)" }}>
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.name}</div>
                    {u.isBlacklisted && <div className="text-[11px] font-semibold" style={{ color: "var(--brick)" }}>Blacklisted</div>}
                  </div>
                </div>
              </td>
              <td className="py-2.5 pr-3 f-mono">
                {u.phone}
                {u.phoneVerified && <CheckCircle2 size={12} className="inline ml-1 align-text-top" style={{ color: "var(--banyan)" }} aria-label="Phone verified" />}
              </td>
              <td className="py-2.5 pr-3">
                <span className="break-all">{u.email || "—"}</span>
                {u.email && u.emailVerified && <CheckCircle2 size={12} className="inline ml-1 align-text-top" style={{ color: "var(--banyan)" }} aria-label="Email verified" />}
              </td>
              <td className="py-2.5 pr-3">
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full" style={{ background: "var(--surface)" }}>{u.role.toLowerCase()}</span>
                {u.role === "SELLER" && u.isVerifiedSeller && (
                  <ShieldCheck size={13} className="inline ml-1 align-text-top" style={{ color: "var(--banyan)" }} aria-label="Verified seller" />
                )}
              </td>
              <td className="py-2.5 pr-3 f-mono">{u.listingsCount}</td>
              <td className="py-2.5 pr-3 text-xs" style={{ color: "var(--ink-muted)" }}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-1.5">
                  {u.role === "SELLER" && (
                    <button
                      disabled={busyId === u.id}
                      onClick={() => run(u.id, () => onSetVerifiedSeller(u.id, !u.isVerifiedSeller))}
                      title={u.isVerifiedSeller ? "Remove verified badge" : "Mark as verified seller"}
                      className="p-2 rounded-lg hover:bg-black/5"
                    >
                      {u.isVerifiedSeller ? <ShieldOff size={15} style={{ color: "var(--ink-soft)" }} /> : <ShieldCheck size={15} style={{ color: "var(--banyan)" }} />}
                    </button>
                  )}
                  <button
                    disabled={busyId === u.id}
                    onClick={() => run(u.id, () => onSetBlacklist(u.id, !u.isBlacklisted))}
                    title={u.isBlacklisted ? "Remove from blacklist" : "Blacklist this user"}
                    className="p-2 rounded-lg hover:bg-black/5"
                  >
                    <Ban size={15} style={{ color: u.isBlacklisted ? "var(--ink-muted)" : "var(--brick)" }} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
