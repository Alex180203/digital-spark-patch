import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Globe, Smartphone } from "lucide-react";
import { useApp, useBranding, useTranslations } from "../context/AppContext";
import type { Language } from "../types";

const languageOptions: { code: Language; label: string; flag: string }[] = [
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function LandingScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const brand = useBranding();
  const t = useTranslations();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);

  function changeLanguage(lang: Language) {
    dispatch({ type: "SET_LANGUAGE", language: lang });
    addLedgerEvent("settings.language_changed", `Limbă schimbată la: ${lang}`);
    setShowLangMenu(false);
  }

  const currentLang = languageOptions.find((l) => l.code === state.language) ?? languageOptions[0];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col ${state.highContrast ? "high-contrast" : ""} ${state.largeText ? "large-text" : ""}`}>
      {/* Language picker top right */}
      <div className="flex justify-end p-4 relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          aria-label="Schimbă limba / Change language"
        >
          <Globe className="w-4 h-4" />
          <span>{currentLang.flag} {currentLang.label}</span>
        </button>
        {showLangMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
            <div className="absolute right-4 top-14 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden min-w-[160px]">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${
                    state.language === lang.code ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo / App name */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mb-4 border border-white/20 shadow-xl">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-2">
            {brand.appName}
          </h1>
          <p className="text-blue-200 text-center text-base font-medium max-w-xs leading-snug">
            {brand.tagline}
          </p>
        </div>

        {/* Short description */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-8 max-w-sm w-full border border-white/20">
          <p className="text-white/90 text-sm text-center leading-relaxed">
            {brand.shortDescription}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate("/login/roeid")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white text-blue-900 font-bold text-base shadow-xl hover:bg-blue-50 active:scale-[0.98] transition-all duration-150"
          >
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            {t.actions.loginWithRoeId}
          </button>

          <button
            onClick={() => navigate("/login/cei-nfc")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/10 border border-white/30 text-white font-bold text-base hover:bg-white/20 active:scale-[0.98] transition-all duration-150"
          >
            <Smartphone className="w-5 h-5" />
            {t.actions.loginWithCeiNfc}
          </button>
        </div>

        {/* Demo note */}
        <div className="mt-8 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium border border-white/20">
            {t.common.demoNote}
          </span>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-sm">
          {[
            { label: t.landing.featureDocuments, sublabel: t.landing.featureDocumentsSub },
            { label: t.landing.featureRequests, sublabel: t.landing.featureRequestsSub },
            { label: t.landing.featureDelegations, sublabel: t.landing.featureDelegationsSub },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-white text-xs font-semibold">{f.label}</span>
              <span className="text-white/50 text-[10px] text-center">{f.sublabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="px-6 pb-8 text-center">
        <p className="text-white/40 text-xs leading-relaxed">
          {t.common.mvpDisclaimer}
        </p>
      </div>
    </div>
  );
}
