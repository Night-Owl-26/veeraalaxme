import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, ChevronDown, Calculator, Home as HomeIcon,
  Bookmark, Scale, MessageCircle, PlusSquare, Building2, ShieldCheck, Compass,
} from "lucide-react";
import CompassLogo from "../property/CompassLogo";
import NotificationsPanel from "./NotificationsPanel";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/format";

const NAV_BASE = [
  { to: "/", label: "Feed", icon: HomeIcon, end: true },
  { to: "/vastu", label: "Vastu", icon: Compass },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/compare", label: "Compare", icon: Scale, key: "compare" },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];

export default function Header({ compareCount = 0, savedCount = 0, onOpenEmi }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [q, setQ] = useState("");

  const navItems = [...NAV_BASE];
  if (user?.role === "SELLER") navItems.push({ to: "/post", label: "Post Property", icon: PlusSquare }, { to: "/my-listings", label: "My Listings", icon: Building2 });
  if (user?.role === "ADMIN") navItems.push({ to: "/admin", label: "Dashboard", icon: ShieldCheck });

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <header className="sticky top-0 z-40" style={{ background: "var(--ink)" }}>
      <a href="#main-content" className="vc-skip-link">Skip to content</a>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <CompassLogo size={26} />
          <span className="f-display text-lg sm:text-xl" style={{ color: "#fff" }}>
            Vasthu<span style={{ color: "var(--turmeric)", fontStyle: "italic" }}>Connect</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden md:block flex-1 max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} aria-hidden="true" />
            <input
              className="vc-input pl-9" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)", color: "#fff" }}
              placeholder="Search by locality, e.g. Anna Nagar" value={q} onChange={(e) => setQ(e.target.value)}
              aria-label="Search listings"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {!user && (
            <Link to="/vastu" className="vc-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>
              <Compass size={15} aria-hidden="true" /> <span className="hidden sm:inline">Vastu</span>
            </Link>
          )}
          {user && (
            <button onClick={onOpenEmi} className="hidden sm:flex vc-btn-ghost items-center gap-1.5 px-3 py-2 text-xs font-semibold" style={{ borderColor: "rgba(255,255,255,.2)", color: "#fff" }}>
              <Calculator size={15} aria-hidden="true" /> EMI
            </button>
          )}

          {user && (
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications" className="relative p-2.5 rounded-full hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Bell size={18} color="#fff" aria-hidden="true" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--turmeric)" }} aria-hidden="true" />
              </button>
              <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          )}

          {user ? (
            <div className="relative">
              <button onClick={() => setRoleMenuOpen((v) => !v)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 min-h-[44px]" aria-haspopup="menu" aria-expanded={roleMenuOpen}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center f-mono text-[11px] font-bold" style={{ background: "var(--turmeric)", color: "var(--ink)" }}>
                  {initials(user.name)}
                </span>
                <ChevronDown size={14} color="#fff" aria-hidden="true" />
              </button>
              {roleMenuOpen && (
                <div role="menu" className="absolute right-0 mt-2 w-60 vc-card shadow-xl p-2 z-50">
                  <div className="px-3 py-1.5 vc-eyebrow">{user.name}</div>
                  <div className="px-3 pb-2 text-xs capitalize" style={{ color: "var(--ink-muted)" }}>{user.role.toLowerCase()} account</div>
                  <button onClick={() => { setRoleMenuOpen(false); navigate("/profile"); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-black/5 min-h-[44px]">
                    My Profile
                  </button>
                  <button onClick={async () => { setRoleMenuOpen(false); await logout(); navigate("/login"); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-black/5 min-h-[44px]" style={{ color: "var(--brick)" }}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="vc-btn-primary px-4 py-2.5 text-sm">Log in</Link>
          )}
        </div>
      </div>

      {user && (
        <nav aria-label="Primary" className="hidden md:flex max-w-6xl mx-auto px-4 sm:px-6 pb-2 items-center gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={`vc-navlink flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap ${active ? "active" : ""}`}>
                <Icon size={14} aria-hidden="true" />
                {item.label}
                {item.key === "compare" && compareCount > 0 && (
                  <span className="ml-0.5 f-mono text-[10px] font-bold px-1.5 rounded-full" style={{ background: "var(--turmeric)", color: "var(--ink)" }}>{compareCount}</span>
                )}
                {item.to === "/saved" && savedCount > 0 && (
                  <span className="ml-0.5 f-mono text-[10px] font-bold px-1.5 rounded-full" style={{ background: "var(--turmeric)", color: "var(--ink)" }}>{savedCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
