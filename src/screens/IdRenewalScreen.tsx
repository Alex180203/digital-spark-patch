import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Clock, FileText, CreditCard,
  Activity, AlertTriangle, Info,
  ExternalLink, Check, X as XIcon
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { ceiEligibilityScenarios, mockAppointmentSlots } from "../data/mockData";
import type { CEIEligibilityScenario, AppRequest } from "../types";

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;

interface ChecklistItem {
  label: string;
  status: "verified" | "bring" | "action" | "na";
  note: string;
}

export function IdRenewalScreen() {
  const { addLedgerEvent, dispatch } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<FlowStep>(1);
  const [selectedScenario, setSelectedScenario] = useState<CEIEligibilityScenario>(ceiEligibilityScenarios[0]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [booked, setBooked] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);

  const totalSteps = 6;

  const checklist: ChecklistItem[] = [
    { label: "Actul de identitate actual", status: "bring", note: "Adu originalul la ghișeu" },
    { label: "Certificat de naștere în original", status: "bring", note: "Adu originalul la ghișeu" },
    { label: "Certificat de căsătorie", status: "na", note: "Nu se aplică" },
    { label: "Dovada adresei de domiciliu", status: "verified", note: "Adresă confirmată în profilul demo" },
    { label: "Dovada achitării taxei", status: selectedScenario.isFree ? "verified" : "action", note: selectedScenario.isFree ? "Gratuitate confirmată" : "Necesită plată" },
  ];

  const availableDates = [...new Set(mockAppointmentSlots.map((s) => s.date))];
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const slotsForDate = mockAppointmentSlots.filter((s) => s.date === selectedDate && s.available);

  async function handleBookSlot() {
    if (!selectedSlot) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    addLedgerEvent("request.appointment_selected", `Programare demo selectată: ${selectedSlot.date} la ${selectedSlot.time}`);
    setBooked(true);
    showToast(t.idFlow.bookingSuccess, "success");
    setLoading(false);
  }

  async function handleCreateRequest() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const today = format(new Date(), "yyyy-MM-dd");
    const requestId = `req-cei-${Date.now()}`;

    const newRequest: AppRequest = {
      id: requestId,
      title: "Reînnoire Carte Electronică de Identitate",
      type: "identity_renewal",
      status: "appointment_selected",
      institution: "Evidența Persoanelor Cluj-Napoca",
      steps: [
        { id: "s1", title: "Notificare primită", status: "completed", timestamp: format(addDays(new Date(), -5), "yyyy-MM-dd") },
        { id: "s2", title: "Eligibilitate verificată", status: "completed", timestamp: today },
        { id: "s3", title: "Documente pregătite", status: "completed", timestamp: today },
        { id: "s4", title: "Gratuitate / Taxă confirmată", status: "completed", timestamp: today },
        { id: "s5", title: "Programare aleasă", status: "completed", timestamp: today },
        { id: "s6", title: "Depunere la ghișeu", status: "active" },
        { id: "s7", title: "În procesare", status: "pending" },
        { id: "s8", title: "Gata de ridicare", status: "pending" },
      ],
      appointment: selectedSlot
        ? { date: selectedSlot.date, time: selectedSlot.time, office: "Evidența Persoanelor Cluj-Napoca — Ghișeu 3" }
        : undefined,
      createdAt: today,
      updatedAt: today,
    };

    dispatch({ type: "ADD_REQUEST", request: newRequest });
    addLedgerEvent("request.created", `Cerere reînnoire CEI creată: ${requestId}`);
    showToast("Cerere creată cu succes!", "success");
    navigate("/requests");
    setLoading(false);
  }

  const statusIcons = {
    verified: <CheckCircle className="w-4 h-4 text-green-600" />,
    bring: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    action: <XIcon className="w-4 h-4 text-red-600" />,
    na: <span className="text-slate-400 text-xs font-medium">N/A</span>,
  };

  const statusBg = {
    verified: "bg-green-50 border-green-200",
    bring: "bg-amber-50 border-amber-200",
    action: "bg-red-50 border-red-200",
    na: "bg-slate-50 border-slate-200 opacity-60",
  };

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep((s) => (s - 1) as FlowStep)}
          className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
          aria-label={t.actions.back}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            {brand.idRenewalFlowName}
          </h1>
          <p className="text-xs text-slate-500">Pas {step} din {totalSteps}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step 1: Document overview */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Carte de identitate</p>
                  <Badge variant="attention">Expiră curând</Badge>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Expiră în", value: "74 zile", highlight: true },
                  { label: "Instituție", value: "Evidența Persoanelor / HUB MAI" },
                  { label: "Tip cerere", value: "Reînnoire → CEI" },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className={`text-sm font-medium ${highlight ? "text-amber-700" : "text-slate-900"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">{t.idFlow.step1Note}</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-slate-700 mb-1">Acțiune recomandată</p>
            <p className="text-sm text-slate-600">Pregătește reînnoirea către Carte Electronică de Identitate (CEI).</p>
          </div>

          <Button fullWidth size="lg" onClick={() => setStep(2)}>
            {t.actions.continue}
          </Button>
        </div>
      )}

      {/* Step 2: Eligibility checker */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t.idFlow.step2Title}</h2>
            <p className="text-sm text-slate-500 mt-1">Selectează scenariul care ți se aplică:</p>
          </div>

          <div className="space-y-2">
            {ceiEligibilityScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedScenario.id === scenario.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{scenario.label}</span>
                  <div className="flex items-center gap-2">
                    {scenario.isFree ? (
                      <Badge variant="ok">Gratuit</Badge>
                    ) : (
                      <Badge variant="attention">{scenario.cost} lei</Badge>
                    )}
                    {selectedScenario.id === scenario.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Result card */}
          <Card className={selectedScenario.isFree ? "border-green-300" : "border-amber-300"}>
            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                {selectedScenario.isFree ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <CreditCard className="w-6 h-6 text-amber-600" />
                )}
                <p className="font-bold text-slate-900">{selectedScenario.resultMessage}</p>
              </div>
              {selectedScenario.isFree ? (
                <p className="text-sm text-green-700">{t.idFlow.eligibleFree}</p>
              ) : (
                <p className="text-sm text-amber-700">Taxă: {selectedScenario.cost} lei</p>
              )}
              <p className="text-xs text-slate-500 mt-2">Motiv: {selectedScenario.reason}</p>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">{t.idFlow.scenarioNote}</p>
          </div>

          <Button fullWidth size="lg" onClick={() => setStep(3)}>
            {t.idFlow.step2Title} — Continuă
          </Button>
        </div>
      )}

      {/* Step 3: Required documents */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t.idFlow.checklistTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">{t.idFlow.checklistNote}</p>
          </div>

          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${statusBg[item.status]}`}>
                <div className="flex-shrink-0 mt-0.5">{statusIcons[item.status]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.status === "na" ? "text-slate-400" : "text-slate-800"}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    item.status === "verified" ? "text-green-600" :
                    item.status === "bring" ? "text-amber-600" :
                    item.status === "action" ? "text-red-600" : "text-slate-400"
                  }`}>
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              Nu trebuie să încarci documente digital. Adu originalele la ghișeu la data programării.
            </p>
          </div>

          <Button fullWidth size="lg" onClick={() => setStep(4)}>
            {t.actions.continue}
          </Button>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t.idFlow.step4Title}</h2>

          {selectedScenario.isFree ? (
            <>
              <div className="bg-green-50 border border-green-300 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div>
                  <p className="text-lg font-bold text-green-800">{t.idFlow.freeTitle}</p>
                  <p className="text-sm text-green-700 mt-1">{t.idFlow.freeSubtitle}</p>
                </div>
                <Badge variant="ok">Gratuitate confirmată</Badge>
              </div>
              <Button fullWidth size="lg" onClick={() => setStep(5)}>
                {t.actions.schedule}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
                <p className="font-bold text-amber-800 mb-1">{t.idFlow.paymentTitle}</p>
                <p className="text-2xl font-black text-amber-700">{selectedScenario.cost} lei</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Ghișeul.ro", desc: "Plată online dacă taxa/instituția este disponibilă", icon: <ExternalLink className="w-4 h-4" /> },
                  { label: "CEC Bank / SelfPay", desc: "Plată la ghișeu sau terminal", icon: <CreditCard className="w-4 h-4" /> },
                  { label: "Am plătit deja", desc: "Marchează taxa ca plătită", icon: <Check className="w-4 h-4" /> },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => { showToast("În MVP, plata este simulată. Continuă cu programarea.", "info"); setStep(5); }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs text-slate-500">
                  {brand.appName} nu procesează plata în MVP. Te direcționează către canalul oficial disponibil.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 5: Scheduling */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t.idFlow.step5Title}</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-sm text-blue-800">{t.idFlow.scheduleNote}</p>
          </div>

          {!booked ? (
            <>
              {/* Date picker */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">{t.idFlow.selectDate}</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedDate === date
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">{t.idFlow.availableSlots}</p>
                <div className="grid grid-cols-3 gap-2">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot({ date: slot.date, time: slot.time })}
                      className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                        selectedSlot?.time === slot.time && selectedSlot?.date === slot.date
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleBookSlot}
                disabled={!selectedSlot}
                loading={loading}
              >
                {t.idFlow.bookDemo}
              </Button>

              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={() => setShowExternalModal(true)}
              >
                <ExternalLink className="w-4 h-4" />
                {t.idFlow.openHubMai}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Programare demo confirmată</p>
                  <p className="text-sm text-green-700">{selectedSlot?.date} la {selectedSlot?.time}</p>
                  <p className="text-xs text-green-600 mt-1">Evidența Persoanelor Cluj-Napoca — Ghișeu 3</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">{t.idFlow.bookingSuccess}</p>
              <Button fullWidth size="lg" onClick={() => setStep(6)}>
                {t.idFlow.requestCreated} — Continuă
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Request tracker */}
      {step === 6 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Cerere urmăribilă</h2>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Reînnoire Carte Electronică de Identitate</p>
                  <p className="text-xs text-slate-500">Evidența Persoanelor Cluj-Napoca</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { label: "Notificare primită", done: true },
                  { label: "Eligibilitate verificată", done: true },
                  { label: "Documente pregătite", done: true },
                  { label: "Gratuitate / Taxă confirmată", done: true },
                  { label: "Programare aleasă", done: true },
                  { label: "Depunere la ghișeu", done: false, active: true },
                  { label: "În procesare", done: false },
                  { label: "Gata de ridicare", done: false },
                ].map((s, idx, arr) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.done ? "bg-green-500" :
                        s.active ? "bg-blue-600 ring-4 ring-blue-100" :
                        "bg-slate-200"
                      }`}>
                        {s.done ? (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        ) : s.active ? (
                          <Clock className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 ${s.done ? "bg-green-300" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <p className={`text-sm pt-0.5 pb-6 ${
                      s.done ? "text-slate-600" :
                      s.active ? "text-blue-700 font-semibold" :
                      "text-slate-400"
                    }`}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-green-700 font-medium">Pașii următori:</p>
            <p className="text-xs text-green-600 mt-1">
              Prezintă-te la ghișeu cu documentele originale pe data programată.
              LaZi îți va trimite notificare când cererea avansează.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button fullWidth size="lg" onClick={handleCreateRequest} loading={loading}>
              {t.idFlow.viewRequest}
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate("/dashboard")}>
              Înapoi la tablou de bord
            </Button>
          </div>
        </div>
      )}

      {/* External service modal */}
      {showExternalModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowExternalModal(false)}>
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">HUB MAI — Programare oficială</h3>
            <p className="text-sm text-slate-600">
              Programarea oficială pentru CEI se face prin platforma HUB MAI a Ministerului Afacerilor Interne.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                Vei ieși din aplicație. {brand.appName} nu controlează conținutul platformei HUB MAI.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowExternalModal(false)}>
                Anulează
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowExternalModal(false);
                  showToast("Redirecționare simulată către HUB MAI — demo", "info");
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Deschide HUB MAI
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
