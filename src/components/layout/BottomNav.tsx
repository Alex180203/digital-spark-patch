import React from "react";
import { NavLink } from "react-router-dom";
import { Home, FileText, Bell, Calendar as CalendarIcon, User, Building2, Hash } from "lucide-react";
import { useApp, useTranslations } from "../../context/AppContext";

export function BottomNav() {
  const { state } = useApp();
  const t = useTranslations();
  const isClerk = state.currentRole === "clerk";
  const unread = state.citizen?.notifications.filter((n) => !n.read).length ?? 0;

  const citizenLinks = [
    { to: "/dashboard", icon: Home, label: t.nav.home },
    { to: "/notifications", icon: Bell, label: t.nav.notifications ?? "Notificări", badge: unread },
    { to: "/calendar", icon: CalendarIcon, label: "Calendar" },
    { to: "/documents", icon: FileText, label: t.nav.documents },
    { to: "/profile", icon: User, label: t.nav.profile },
  ] as Array<{ to: string; icon: typeof Home; label: string; badge?: number }>;

  const clerkLinks = [
    { to: "/clerk", icon: Building2, label: t.common.roles.clerk },
    { to: "/ledger", icon: Hash, label: t.nav.ledger },
    { to: "/profile", icon: User, label: t.nav.profile },
  ];

  const links = isClerk ? clerkLinks : citizenLinks;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t.nav.home}
    >
      <div className="flex">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors duration-150 ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? "stroke-2" : "stroke-[1.5]"}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
