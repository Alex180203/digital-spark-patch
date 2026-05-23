import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";

type Step = "credentials" | "twofa";

const DEMO_EMAIL = "razvan@example.com";
const DEMO_PASSWORD = "demo123";
const DEMO_2FA = "123456";

export function LoginRoeIdScreen() {
  const { dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      addLedgerEvent("auth.roeid_login_success", `Autentificare ROeID demo reușită pentru: ${email}`);
      setStep("twofa");
    } else {
      setError(t.auth.loginError);
      showToast(t.auth.loginError, "error");
    }
    setLoading(false);
  }

  async function handleTwoFa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    if (code.trim() === DEMO_2FA) {
      addLedgerEvent("auth.two_factor_verified", "2FA verificat cu succes — ROeID demo");
      dispatch({ type: "LOGIN", method: "roeid" });
      showToast("Autentificare reușită!", "success");
      navigate("/dashboard", { replace: true });
    } else {
      setError(t.auth.twoFaError);
      showToast(t.auth.twoFaError, "error");
    }
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

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>

        {step === "credentials" ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 text-center">ROeID Demo</h1>
            <p className="text-slate-500 text-sm text-center mb-8">
              Autentificare simulată pentru hackathon
            </p>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <Input
                label={t.auth.email}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="razvan@example.com"
                autoComplete="username"
                required
              />
              <div className="relative">
                <Input
                  label={t.auth.password}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  error={error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Demo credentials:</p>
                <p className="text-xs text-blue-600 mt-0.5">Email: razvan@example.com</p>
                <p className="text-xs text-blue-600">Parolă: demo123</p>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {t.actions.continue}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 text-center">{t.auth.twoFaTitle}</h1>
            <p className="text-slate-500 text-sm text-center mb-8">{t.auth.twoFaDescription}</p>

            <form onSubmit={handleTwoFa} className="w-full flex flex-col gap-4">
              <Input
                label={t.auth.twoFaCode}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                pattern="\d{6}"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                error={error}
              />

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Cod demo:</p>
                <p className="text-xs text-blue-600 mt-0.5">123456</p>
              </div>

              <Button type="submit" fullWidth size="lg" loading={loading}>
                {t.actions.confirm}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-xs text-slate-400 text-center">{t.common.demoNote}</p>
      </div>
    </div>
  );
}
