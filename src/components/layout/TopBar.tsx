import React, { useState } from "react";
import { Bell, ChevronDown, Shield, User, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp, useTranslations, useBranding } from "../../context/AppContext";
import type { UserRole } from "../../types";

export function TopBar() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = state.citizen?.notifications.filter((n) => !n.read).length ?? 0;

  const roles: { key: UserRole; label: string; icon: React.ReactNode }[] = [
    { key: "citizen", label: t.common.roles.citizen, icon: <User className="w-4 h-4" /> },
    { key: "delegate", label: t.common.roles.delegate, icon: <Briefcase className="w-4 h-4" /> },
    { key: "clerk", label: t.common.roles.clerk, icon: <Shield className="w-4 h-4" /> },
  ];

  const currentRole = roles.find((r) => r.key === state.currentRole) ?? roles[0];

  function switchRole(role: UserRole) {
    dispatch({ type: "SET_ROLE", role });
    addLedgerEvent("settings.role_switched", `Rol schimbat la: ${role}`);
    setShowRoleMenu(false);
    if (role === "clerk") {
      navigate("/clerk");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-40">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <span className="font-bold text-lg text-blue-600 tracking-tight">{brand.appName}</span>

        <div className="flex items-center gap-2">
          {/* Role switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-700"
              aria-label="Schimbă rol demo"
              aria-expanded={showRoleMenu}
            >
              {currentRole.icon}
              <span className="hidden sm:inline">{currentRole.label}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 min-w-[180px] overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {t.common.demoBadge}
                    </span>
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => switchRole(r.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                        state.currentRole === r.key
                          ? "text-blue-600 font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      {r.icon}
                      {r.label}
                      {state.currentRole === r.key && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label={`${t.notifications.title} (${unreadCount} necitite)`}
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
