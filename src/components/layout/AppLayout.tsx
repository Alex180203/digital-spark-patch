import React, { useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, FileText, ClipboardList, Users, User, Building2, Hash, FileSignature, Calendar, Sparkles, Bell } from "lucide-react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { useApp, useTranslations } from "../../context/AppContext";

function DesktopSideNav() {
  const { state } = useApp();
  const t = useTranslations();
  const isClerk = state.currentRole === "clerk";
  const unread = state.citizen?.notifications.filter((n) => !n.read).length ?? 0;

  const citizenLinks = [
    { to: "/notifications", icon: Bell, label: "Notificări", badge: unread },
    { to: "/dashboard", icon: Home, label: t.nav.home },
    { to: "/calendar", icon: Calendar, label: "Calendar" },
    { to: "/documents", icon: FileText, label: t.nav.documents },
    { to: "/declaratii", icon: FileSignature, label: "Declarații" },
    { to: "/requests", icon: ClipboardList, label: t.nav.requests },
    { to: "/rules", icon: Sparkles, label: "Reguli auto" },
    { to: "/delegations", icon: Users, label: t.nav.delegations },
    { to: "/profile", icon: User, label: t.nav.profile },
  ] as Array<{ to: string; icon: typeof Home; label: string; badge?: number }>;

  const clerkLinks = [
    { to: "/clerk", icon: Building2, label: t.common.roles.clerk },
    { to: "/ledger", icon: Hash, label: t.nav.ledger },
    { to: "/profile", icon: User, label: t.nav.profile },
  ] as Array<{ to: string; icon: typeof Home; label: string; badge?: number }>;

  const links = isClerk ? clerkLinks : citizenLinks;

  return (
    <aside className="hidden lg:flex flex-col w-56 fixed inset-y-0 pt-14 bg-white border-r border-slate-200 z-30 overflow-y-auto">
      <nav className="flex flex-col py-4 px-3 gap-1" aria-label="Navigare principală desktop">
        {links.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "stroke-2" : "stroke-[1.5]"}`} />
                <span className="flex-1">{label}</span>
                {badge && badge > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function AppLayout() {
  const { state } = useApp();

  useEffect(() => {
    document.documentElement.style.fontSize = state.largeText ? "118%" : "";
  }, [state.largeText]);

  return (
    <div className={`min-h-screen bg-slate-50 ${state.highContrast ? "high-contrast" : ""}`}>
      <TopBar />
      <DesktopSideNav />
      <main className="lg:pl-56 pt-14" id="main-content">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 lg:pb-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
