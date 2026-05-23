import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, ArrowLeft, CheckCircle, Wifi } from "lucide-react";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Button } from "../components/lazi-ui/Button";
import { Input } from "../components/lazi-ui/Input";
import { useToast } from "../components/lazi-ui/Toast";

type Step = "can" | "pin" | "tap" | "verified";

export function LoginCeiNfcScreen() {
  const { dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("can");
  const [can, setCan] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [tapping, setTapping] = useState(false);

  const steps = [
    { key: "can", label: "Introdu CAN" },
    { key: "pin", label: "Introdu PIN" },
    { key: "tap", label: "Atinge cardul" },
    { key: "verified", label: "Verificat" },
  ];
  const currentStepIdx = steps.findIndex((s) => s.key === step);

  async function handleCan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setStep("pin");
    setLoading(false);
  }

  async function handlePin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setStep("tap");
    setLoading(false);
  }

  async function handleTap() {
    setTapping(true);
    await new Promise((r) => setTimeout(r, 2000));
    setTapping(false);
    setStep("verified");
  }

  async function handleComplete() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    addLedgerEvent("auth.cei_nfc_demo_success", "Autentificare CEI NFC demo reușită — date simulate din cip");
    dispatch({ type: "LOGIN", method: "ceiNfc" });
    showToast("Identitate verificată — CEI NFC demo!", "success");
    navigate("/dashboard", { replace: true });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 bg-white">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label={t.actions.back}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-bold text-blue-600 text-lg">{brand.appName}</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center mb-4 shadow-lg">
          <Smartphone className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-1 text-center">
          Autentificare CEI prin NFC — demo
        </h1>
        <p className="text-xs text-slate-500 text-center mb-6">{t.common.eidKitNote}</p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 w-full">
          {steps.map((s, idx) => (
            <React.Fragment key={s.key}>
              <div className={`flex flex-col items-center gap-1 flex-1 ${idx > currentStepIdx ? "opacity-40" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  idx < currentStepIdx
                    ? "bg-green-500 text-white"
                    : idx === currentStepIdx
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {idx < currentStepIdx ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[10px] text-slate-500 text-center leading-tight">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 rounded-full transition-colors ${idx < currentStepIdx ? "bg-green-400" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        {step === "can" && (
          <form onSubmit={handleCan} className="w-full flex flex-col gap-4">
            <Input
              label={t.auth.can}
              type="text"
              value={can}
              onChange={(e) => setCan(e.target.value)}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              required
              hint="CAN-ul se găsește pe spatele cărții de identitate"
            />
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
              <p className="text-xs text-cyan-700">Demo: introduceți orice 6 cifre</p>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              {t.actions.continue}
            </Button>
          </form>
        )}

        {step === "pin" && (
          <form onSubmit={handlePin} className="w-full flex flex-col gap-4">
            <Input
              label={t.auth.pin}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={6}
              inputMode="numeric"
              required
              hint="PIN-ul cărții de identitate"
            />
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
              <p className="text-xs text-cyan-700">Demo: introduceți orice PIN</p>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              {t.actions.continue}
            </Button>
          </form>
        )}

        {step === "tap" && (
          <div className="w-full flex flex-col items-center gap-6">
            <div
              className={`w-40 h-40 rounded-3xl border-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                tapping
                  ? "border-cyan-400 bg-cyan-50 scale-105 shadow-xl shadow-cyan-200"
                  : "border-slate-300 bg-white"
              }`}
            >
              {tapping ? (
                <>
                  <Wifi className="w-12 h-12 text-cyan-500 animate-pulse" />
                  <span className="text-xs text-cyan-600 font-medium text-center px-2">
                    {t.auth.verifying}
                  </span>
                </>
              ) : (
                <>
                  <Smartphone className="w-12 h-12 text-slate-400" />
                  <span className="text-xs text-slate-500 text-center px-2">
                    {t.auth.tapCard}
                  </span>
                </>
              )}
            </div>

            {!tapping && (
              <Button onClick={handleTap} fullWidth size="lg">
                Simulează atingere card
              </Button>
            )}

            {tapping && (
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "verified" && (
          <div className="w-full flex flex-col gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">{t.auth.identityVerified}</p>
                <p className="text-xs text-green-600 mt-0.5">{t.auth.dataSource}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Date din cip — simulate</h3>
              {[
                { label: "Nume", value: "Panaite Răzvan" },
                { label: "CNP", value: "5************" },
                { label: "Localitate", value: "Cluj-Napoca, România" },
                { label: "Sursă date", value: "CEI chip demo" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700 leading-relaxed">{t.common.privacyNote}</p>
            </div>

            <Button onClick={handleComplete} fullWidth size="lg" loading={loading}>
              Intră în aplicație
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400 text-center">{t.common.demoNote}</p>
      </div>
    </div>
  );
}
