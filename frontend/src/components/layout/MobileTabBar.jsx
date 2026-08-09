import { NavLink } from "react-router-dom";
import { Home as HomeIcon, Scale, Bookmark, MessageCircle, PlusSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// A native-app-style bottom tab bar for small screens — the primary nav
// pattern people already know from Instagram/Zillow/99acres mobile apps,
// so property browsing feels natural on a phone instead of like a shrunk
// desktop site. Hidden at md+ where the header's nav row takes over.
export default function MobileTabBar({ compareCount = 0, savedCount = 0 }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = [
    { to: "/", label: "Feed", icon: HomeIcon, end: true },
    { to: "/compare", label: "Compare", icon: Scale, badge: compareCount },
    ...(user.role === "SELLER" ? [{ to: "/post", label: "Post", icon: PlusSquare, isAction: true }] : []),
    { to: "/saved", label: "Saved", icon: Bookmark, badge: savedCount },
    { to: "/chat", label: "Chat", icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch"
      style={{ background: "var(--card)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative ${isActive ? "" : ""}`
            }
          >
            {({ isActive }) => (
              <>
                {item.isAction ? (
                  <span className="w-9 h-9 rounded-full flex items-center justify-center -mt-1" style={{ background: "var(--brick)" }}>
                    <Icon size={18} color="#fff" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon size={20} color={isActive ? "var(--brick)" : "var(--ink-muted)"} aria-hidden="true" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 f-mono text-[9px] font-bold px-1 rounded-full" style={{ background: "var(--turmeric)", color: "var(--ink)" }}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
                <span className="text-[10px] font-semibold" style={{ color: isActive ? "var(--brick)" : "var(--ink-muted)" }}>{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
