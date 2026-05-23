import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Globe, Eye, Type, LogOut,
  ChevronRight, ShieldCheck, Users, Hash, ToggleLeft, ToggleRight, Bell
} from "lucide-react";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import type { Language, NotificationPreference } from "../types";

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function ProfileScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const citizen = state.citizen;
  if (!citizen) return null;

  function changeLanguage(lang: Language) {
    dispatch({ type: "SET_LANGUAGE", language: lang });
    addLedgerEvent("settings.language_changed", `Language changed to: ${lang}`);
    setShowLangMenu(false);
    showToast(t.profile.languageChanged, "success");
  }

  function handleLogout() {
    addLedgerEvent("auth.logout", "Deconectare din aplicație");
    dispatch({ type: "LOGOUT" });
    navigate("/", { replace: true });
  }

  function toggleHighContrast() {
    dispatch({ type: "TOGGLE_HIGH_CONTRAST" });
    showToast(state.highContrast ? t.profile.highContrastOff : t.profile.highContrastOn, "info");
  }

  function toggleLargeText() {
    dispatch({ type: "TOGGLE_LARGE_TEXT" });
    showToast(state.largeText ? t.profile.largeTextOff : t.profile.largeTextOn, "info");
  }

  const currentLang = languageOptions.find((l) => l.code === state.language) ?? languageOptions[0];
  const activeDelegation = citizen.delegations.find((d) => d.status === "active");

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{t.profile.title}</h1>

      {/* User card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-lg">{citizen.fullName}</p>
              <p className="text-sm text-slate-500">{citizen.cnpMasked}</p>
              <p className="text-xs text-slate-400">{citizen.city}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{t.profile.address}</span>
              <span className="text-xs font-medium text-slate-700">{citizen.address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{t.profile.loginMethod}</span>
              <span className="text-xs font-medium text-slate-700">
                {citizen.loginMethod === "roeid" ? t.profile.roeidMethod : t.profile.ceiMethod}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">{t.common.role}</span>
              <Badge variant={state.currentRole === "citizen" ? "ok" : state.currentRole === "delegate" ? "attention" : "info"}>
                {t.common.roles[state.currentRole]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust indicators */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span className="text-xs text-green-700 font-medium">{t.dashboard.trustBadge}</span>
      </div>

      {/* Delegated access */}
      {activeDelegation && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{t.profile.delegatedAccess}</p>
                <p className="text-xs text-slate-500">
                  {activeDelegation.delegateName} • {t.delegations.validPeriod} {activeDelegation.validUntil}
                </p>
              </div>
              <Badge variant="ok">{t.profile.activeMode}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          {t.profile.language}
        </p>
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">{currentLang.flag} {currentLang.label}</p>
                <p className="text-xs text-slate-500">{brand.appName} — {brand.tagline.slice(0, 30)}...</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>

          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 overflow-hidden">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                      state.language === lang.code ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                    {state.language === lang.code && (
                      <span className="ml-auto text-blue-600 text-xs font-medium">{t.profile.activeMode}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          {t.profile.accessibility}
        </p>
        <Card>
          <CardContent className="space-y-0 p-0">
            <button
              onClick={toggleHighContrast}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{t.profile.highContrast}</p>
                  <p className="text-xs text-slate-500">{t.profile.highContrastDesc}</p>
                </div>
              </div>
              {state.highContrast ? (
                <ToggleRight className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>

            <button
              onClick={toggleLargeText}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-slate-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">{t.profile.largeText}</p>
                  <p className="text-xs text-slate-500">{t.profile.largeTextDesc}</p>
                </div>
              </div>
              {state.largeText ? (
                <ToggleRight className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Audit ledger link */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          {t.profile.auditSecurity}
        </p>
        <button
          onClick={() => navigate("/ledger")}
          className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-slate-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">{t.ledger.title}</p>
              <p className="text-xs text-slate-500">{state.ledger.length} {t.profile.eventsRecorded}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Notification preference */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
          {t.profile.notificationPreference}
        </p>
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500">{t.profile.notificationPreferenceDesc}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["phone", "email", "both"] as NotificationPreference[]).map((pref) => {
                const labels: Record<NotificationPreference, string> = {
                  phone: t.profile.notifPhone,
                  email: t.profile.notifEmail,
                  both: t.profile.notifBoth,
                };
                const isSelected = state.notificationPreference === pref;
                return (
                  <button
                    key={pref}
                    onClick={() => {
                      dispatch({ type: "SET_NOTIFICATION_PREFERENCE", preference: pref });
                      showToast(t.profile.notificationSaved, "success");
                    }}
                    className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {labels[pref]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">{t.profile.autoRemindersNote}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data sharing note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-700 mb-1">{t.profile.dataSharing}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{t.profile.dataSharingNote}</p>
      </div>

      {/* Logout */}
      <Button
        variant="danger"
        fullWidth
        size="lg"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        {t.actions.logout}
      </Button>

      <div className="text-center pb-2 space-y-1">
        <p className="text-xs text-slate-400">{brand.appName} • {t.common.demoBadge}</p>
        <p className="text-xs text-slate-400">{t.common.simulatedData}</p>
      </div>
    </div>
  );
}
