import React, { useState } from "react";
import {
  Users, Plus, CheckCircle, Shield, X as XIcon,
  Smartphone, Search, FileText, Eye
} from "lucide-react";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Badge } from "../components/lazi-ui/Badge";
import { Button } from "../components/lazi-ui/Button";
import { Input } from "../components/lazi-ui/Input";
import { useToast } from "../components/lazi-ui/Toast";
import { mockPersonLookup } from "../data/mockData";
import type { Delegation } from "../types";
import { addDays, addMonths, addYears, format } from "date-fns";

type CreateStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type DelegationType = "monitoring" | "acting";

const DOMAINS = [
  { key: "documents", labelKey: "documents" as const },
  { key: "taxes", labelKey: "taxes" as const },
  { key: "transport", labelKey: "transport" as const },
  { key: "health", labelKey: "health" as const },
  { key: "all", labelKey: "all" as const },
];

const VALIDITY_OPTIONS = [
  { key: "30d", labelKey: "days30" as const, fn: () => addDays(new Date(), 30) },
  { key: "6m", labelKey: "months6" as const, fn: () => addMonths(new Date(), 6) },
  { key: "1y", labelKey: "year1" as const, fn: () => addYears(new Date(), 1) },
];

interface NewDelegation {
  personId: string;
  personName: string;
  cnp: string;
  delegationType: DelegationType;
  domain: string;
  permissions: {
    viewNotifications: boolean;
    trackRequests: boolean;
    createAppointments: boolean;
    uploadFiles: boolean;
    makePayments: boolean;
    viewSensitiveData: boolean;
  };
  validity: string;
  signingMethod: "roeid" | "ceiNfc";
  procuraUploaded: boolean;
}

const MONITORING_PERMISSIONS = {
  viewNotifications: true,
  trackRequests: true,
  createAppointments: false,
  uploadFiles: false,
  makePayments: false,
  viewSensitiveData: false,
};

const ACTING_PERMISSIONS = {
  viewNotifications: true,
  trackRequests: true,
  createAppointments: true,
  uploadFiles: true,
  makePayments: false,
  viewSensitiveData: false,
};

function DelegationCard({
  delegation,
  onRevoke,
  canRevoke,
}: {
  delegation: Delegation;
  onRevoke: (id: string) => void;
  canRevoke: boolean;
}) {
  const t = useTranslations();
  const isActive = delegation.status === "active";

  const permissionLabels = [
    { key: "viewNotifications", label: t.delegations.permissions.viewNotifications },
    { key: "trackRequests", label: t.delegations.permissions.trackRequests },
    { key: "createAppointments", label: t.delegations.permissions.createAppointments },
    { key: "uploadFiles", label: t.delegations.permissions.uploadFiles },
    { key: "makePayments", label: t.delegations.permissions.makePayments },
    { key: "viewSensitiveData", label: t.delegations.permissions.viewSensitiveData },
  ];

  return (
    <Card className={!isActive ? "opacity-60" : ""}>
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-purple-100" : "bg-slate-100"}`}>
              <Users className={`w-5 h-5 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{delegation.delegateName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {delegation.monitoringOnly ? (
                  <span className="flex items-center gap-1 text-xs text-blue-600">
                    <Eye className="w-3 h-3" />
                    {t.delegations.monitoringType}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-purple-600">
                    <FileText className="w-3 h-3" />
                    {t.delegations.actingType}
                    {delegation.procuraUploaded && <CheckCircle className="w-3 h-3 text-green-500" />}
                  </span>
                )}
              </div>
            </div>
          </div>
          {isActive ? <Badge variant="ok">{t.delegations.activeStatus}</Badge> : <Badge variant="pending">{t.delegations.revokedStatus}</Badge>}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {permissionLabels.map(({ key, label }) => {
            const hasPermission = delegation.permissions[key as keyof typeof delegation.permissions];
            return (
              <span key={key} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                hasPermission
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-slate-50 text-slate-400 border-slate-200 line-through"
              }`}>
                {label}
              </span>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 space-y-0.5">
          <p>{t.delegations.validPeriod}: {delegation.validFrom} → {delegation.validUntil}</p>
          <p>{t.delegations.signedWith}: {delegation.signingMethod === "roeid" ? t.delegations.roeidSigned : t.delegations.ceiSigned}</p>
        </div>

        {isActive && canRevoke && (
          <div className="mt-3">
            <Button variant="danger" size="sm" onClick={() => onRevoke(delegation.id)}>
              <XIcon className="w-3.5 h-3.5" />
              {t.actions.revoke}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateDelegationFlow({ onClose }: { onClose: () => void }) {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();
  const [step, setStep] = useState<CreateStep>(1);
  const [loading, setLoading] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [nfcTapping, setNfcTapping] = useState(false);
  const [nfcDone, setNfcDone] = useState(false);

  // CNP lookup state
  const [cnpInput, setCnpInput] = useState("");
  const [lookupResult, setLookupResult] = useState<{ id: string; name: string; city: string } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupDone, setLookupDone] = useState(false);

  const [draft, setDraft] = useState<NewDelegation>({
    personId: "",
    personName: "",
    cnp: "",
    delegationType: "monitoring",
    domain: "documents",
    permissions: MONITORING_PERMISSIONS,
    validity: "6m",
    signingMethod: "roeid",
    procuraUploaded: false,
  });

  const totalSteps = 7;

  function handleCnpSearch() {
    setLookupError("");
    setLookupResult(null);
    setLookupDone(false);
    const trimmed = cnpInput.trim();
    if (!/^\d{13}$/.test(trimmed)) {
      setLookupError(t.delegations.lookupInvalidCnp);
      return;
    }
    const found = mockPersonLookup.find((p) => p.cnp === trimmed);
    if (found) {
      setLookupResult({ id: found.id, name: found.name, city: found.city });
    } else {
      setLookupError(t.delegations.lookupNotFound);
    }
  }

  function handleConfirmPerson() {
    if (!lookupResult) return;
    setDraft((d) => ({
      ...d,
      personId: lookupResult.id,
      personName: lookupResult.name,
      cnp: cnpInput.trim(),
    }));
    setLookupDone(true);
    setStep(2);
  }

  function selectDelegationType(type: DelegationType) {
    setDraft((d) => ({
      ...d,
      delegationType: type,
      permissions: type === "monitoring" ? MONITORING_PERMISSIONS : ACTING_PERMISSIONS,
    }));
  }

  function updatePermission(key: keyof typeof draft.permissions, value: boolean) {
    setDraft((d) => ({ ...d, permissions: { ...d.permissions, [key]: value } }));
  }

  const validityDate = VALIDITY_OPTIONS.find((v) => v.key === draft.validity)?.fn() ?? addMonths(new Date(), 6);

  async function handleSign2FA() {
    if (twoFaCode !== "123456") {
      showToast("Cod incorect. Demo: 123456", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    addLedgerEvent("delegation.signed_with_roeid_demo", `Delegare semnată ROeID+2FA pentru ${draft.personName}`);
    setStep(7);
    setLoading(false);
  }

  async function handleNfcTap() {
    setNfcTapping(true);
    await new Promise((r) => setTimeout(r, 2000));
    setNfcTapping(false);
    setNfcDone(true);
    addLedgerEvent("delegation.signed_with_cei_demo", `Delegare semnată CEI NFC demo pentru ${draft.personName}`);
  }

  async function handleNfcComplete() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setStep(7);
    setLoading(false);
  }

  async function handleSimulateProcura() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setDraft((d) => ({ ...d, procuraUploaded: true }));
    addLedgerEvent("delegation.procura_uploaded_demo", `Procură simulată încărcată pentru ${draft.personName}`);
    showToast(t.delegations.procuraUploaded, "success");
    setLoading(false);
  }

  async function handleCreateDelegation() {
    if (state.currentRole !== "citizen") {
      showToast("Doar cetățeanul poate crea delegări.", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const newDelegation: Delegation = {
      id: `del-${Date.now()}`,
      citizenId: "cit-001",
      delegateName: draft.personName,
      domain: draft.domain,
      permissions: draft.permissions,
      validFrom: format(new Date(), "yyyy-MM-dd"),
      validUntil: format(validityDate, "yyyy-MM-dd"),
      status: "active",
      signingMethod: draft.signingMethod,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      monitoringOnly: draft.delegationType === "monitoring",
      procuraUploaded: draft.procuraUploaded,
      cnp: draft.cnp,
    };

    dispatch({ type: "CREATE_DELEGATION", delegation: newDelegation });
    addLedgerEvent("delegation.created", `Delegare creată pentru ${draft.personName}, tip: ${draft.delegationType}`);
    showToast(t.delegations.successTitle, "success");
    setLoading(false);
    onClose();
  }

  const actingPermissionItems = [
    { key: "createAppointments" as const, label: t.delegations.permissions.createAppointments },
    { key: "uploadFiles" as const, label: t.delegations.permissions.uploadFiles },
    { key: "makePayments" as const, label: t.delegations.permissions.makePayments },
    { key: "viewSensitiveData" as const, label: t.delegations.permissions.viewSensitiveData },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center">
      <div
        className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-lg mx-auto"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 pt-5 pb-4">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{t.delegations.create}</p>
              <p className="text-xs text-slate-500">{t.common.role} {step}/{totalSteps}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
              <XIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 space-y-4">

          {/* Step 1: CNP lookup */}
          {step === 1 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.cnpLookup}</h3>
              <div className="space-y-3">
                <Input
                  label={t.delegations.cnpLabel}
                  type="text"
                  value={cnpInput}
                  onChange={(e) => {
                    setCnpInput(e.target.value.replace(/\D/g, "").slice(0, 13));
                    setLookupResult(null);
                    setLookupError("");
                  }}
                  placeholder={t.delegations.cnpPlaceholder}
                  inputMode="numeric"
                  maxLength={13}
                />
                <Button
                  fullWidth
                  onClick={handleCnpSearch}
                  disabled={cnpInput.length !== 13}
                >
                  <Search className="w-4 h-4" />
                  {t.delegations.cnpSearch}
                </Button>
              </div>

              {lookupError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm text-red-700">{lookupError}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Demo: {mockPersonLookup.map((p) => p.cnp).join(", ")}
                  </p>
                </div>
              )}

              {lookupResult && !lookupDone && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-800 text-sm">{t.delegations.lookupFound}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-green-200">
                    <p className="font-bold text-slate-900">{lookupResult.name}</p>
                    <p className="text-xs text-slate-500">{lookupResult.city}</p>
                  </div>
                  <Button fullWidth onClick={handleConfirmPerson}>
                    {t.delegations.confirmAddPerson}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 2: Delegation type */}
          {step === 2 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.delegationType}</h3>
              <p className="text-xs text-slate-500">{draft.personName}</p>

              <div className="space-y-3">
                <button
                  onClick={() => selectDelegationType("monitoring")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    draft.delegationType === "monitoring"
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Eye className={`w-5 h-5 ${draft.delegationType === "monitoring" ? "text-blue-600" : "text-slate-400"}`} />
                    <p className="font-semibold text-slate-900 text-sm">{t.delegations.monitoringOnly}</p>
                    {draft.delegationType === "monitoring" && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-slate-500 ml-8">{t.delegations.monitoringOnlyDesc}</p>
                </button>

                <button
                  onClick={() => selectDelegationType("acting")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    draft.delegationType === "acting"
                      ? "border-purple-400 bg-purple-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className={`w-5 h-5 ${draft.delegationType === "acting" ? "text-purple-600" : "text-slate-400"}`} />
                    <p className="font-semibold text-slate-900 text-sm">{t.delegations.actingOnBehalf}</p>
                    {draft.delegationType === "acting" && <CheckCircle className="w-4 h-4 text-purple-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-slate-500 ml-8">{t.delegations.actingOnBehalfDesc}</p>
                  <div className="ml-8 mt-2 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <p className="text-xs text-amber-700 font-medium">{t.delegations.procuraRequired}</p>
                  </div>
                </button>
              </div>

              <Button fullWidth size="lg" onClick={() => setStep(3)}>
                {t.actions.continue}
              </Button>
            </>
          )}

          {/* Step 3: Domain */}
          {step === 3 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.selectDomain}</h3>
              <div className="space-y-2">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain.key}
                    onClick={() => setDraft((d) => ({ ...d, domain: domain.key }))}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      draft.domain === domain.key
                        ? "border-purple-400 bg-purple-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-800">{t.delegations.domains[domain.labelKey]}</span>
                    {draft.domain === domain.key && <CheckCircle className="w-5 h-5 text-purple-600" />}
                  </button>
                ))}
              </div>
              <Button fullWidth size="lg" onClick={() => setStep(4)}>
                {t.actions.continue}
              </Button>
            </>
          )}

          {/* Step 4: Permissions */}
          {step === 4 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.selectPermissions}</h3>

              {draft.delegationType === "monitoring" ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-800">{t.delegations.monitoringOnly}</p>
                  <div className="space-y-1">
                    {[
                      t.delegations.permissions.viewNotifications,
                      t.delegations.permissions.trackRequests,
                    ].map((label) => (
                      <div key={label} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-blue-700">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">{t.delegations.monitoringOnlyDesc}</p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-2">
                    <p className="text-xs font-semibold text-blue-700 mb-1">{t.delegations.monitoringOnly}</p>
                    <div className="flex gap-2 flex-wrap">
                      {[t.delegations.permissions.viewNotifications, t.delegations.permissions.trackRequests].map((l) => (
                        <span key={l} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{l}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {actingPermissionItems.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium text-slate-800">{label}</span>
                        <div
                          className={`w-11 h-6 rounded-full transition-colors relative ${draft.permissions[key] ? "bg-purple-600" : "bg-slate-200"}`}
                          onClick={() => updatePermission(key, !draft.permissions[key])}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.permissions[key] ? "left-6" : "left-1"}`} />
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              <Button fullWidth size="lg" onClick={() => setStep(5)}>
                {t.actions.continue}
              </Button>
            </>
          )}

          {/* Step 5: Validity */}
          {step === 5 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.selectValidity}</h3>
              <div className="space-y-2">
                {VALIDITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDraft((d) => ({ ...d, validity: opt.key }))}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      draft.validity === opt.key
                        ? "border-purple-400 bg-purple-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-800">{t.delegations.validity[opt.labelKey]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">până la {format(opt.fn(), "dd.MM.yyyy")}</span>
                      {draft.validity === opt.key && <CheckCircle className="w-5 h-5 text-purple-600" />}
                    </div>
                  </button>
                ))}
              </div>
              <Button fullWidth size="lg" onClick={() => setStep(6)}>
                {t.actions.continue}
              </Button>
            </>
          )}

          {/* Step 6: Procura (acting only) + Signing */}
          {step === 6 && (
            <>
              <h3 className="font-bold text-slate-900">{t.delegations.selectSigning}</h3>

              {/* Procura required for acting */}
              {draft.delegationType === "acting" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <p className="font-semibold text-amber-800 text-sm">{t.delegations.procuraRequired}</p>
                  </div>
                  <p className="text-xs text-amber-700">{t.delegations.procuraNote}</p>
                  {draft.procuraUploaded ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">{t.delegations.procuraUploaded}</p>
                    </div>
                  ) : (
                    <Button fullWidth variant="outline" onClick={handleSimulateProcura} loading={loading}>
                      <FileText className="w-4 h-4" />
                      {t.delegations.uploadProcuraBtn}
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2 mb-4">
                {[
                  { key: "roeid", label: t.delegations.signing.roeid, icon: <Shield className="w-5 h-5" /> },
                  { key: "ceiNfc", label: t.delegations.signing.ceiNfc, icon: <Smartphone className="w-5 h-5" /> },
                ].map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setDraft((d) => ({ ...d, signingMethod: method.key as "roeid" | "ceiNfc" }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      draft.signingMethod === method.key
                        ? "border-purple-400 bg-purple-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      draft.signingMethod === method.key ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {method.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-800 flex-1 text-left">{method.label}</span>
                    {draft.signingMethod === method.key && <CheckCircle className="w-5 h-5 text-purple-600" />}
                  </button>
                ))}
              </div>

              {/* ROeID signing */}
              {draft.signingMethod === "roeid" && (
                <div className="space-y-3">
                  <Input
                    label="Cod 2FA demo"
                    type="text"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    inputMode="numeric"
                    hint="Demo: introduceti 123456"
                  />
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleSign2FA}
                    loading={loading}
                    disabled={draft.delegationType === "acting" && !draft.procuraUploaded}
                  >
                    Semnează cu ROeID
                  </Button>
                  {draft.delegationType === "acting" && !draft.procuraUploaded && (
                    <p className="text-xs text-amber-600 text-center">{t.delegations.procuraNote}</p>
                  )}
                </div>
              )}

              {/* CEI NFC signing */}
              {draft.signingMethod === "ceiNfc" && (
                <div className="space-y-4 flex flex-col items-center">
                  {!nfcDone ? (
                    <>
                      <div
                        className={`w-32 h-32 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                          nfcTapping ? "border-purple-400 bg-purple-50 scale-105 shadow-xl" : "border-slate-300 bg-white"
                        }`}
                      >
                        <Smartphone className={`w-10 h-10 ${nfcTapping ? "text-purple-500 animate-pulse" : "text-slate-400"}`} />
                        <span className="text-xs text-center text-slate-500 px-2">
                          {nfcTapping ? "Citind..." : "Atinge CEI"}
                        </span>
                      </div>
                      <Button
                        fullWidth
                        onClick={handleNfcTap}
                        loading={nfcTapping}
                        disabled={draft.delegationType === "acting" && !draft.procuraUploaded}
                      >
                        Simulează atingere CEI
                      </Button>
                      {draft.delegationType === "acting" && !draft.procuraUploaded && (
                        <p className="text-xs text-amber-600 text-center">{t.delegations.procuraNote}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 w-full">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <p className="font-semibold text-green-800">Delegarea a fost semnată digital — demo</p>
                      </div>
                      <Button fullWidth size="lg" onClick={handleNfcComplete} loading={loading}>
                        {t.actions.continue}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 7: Success */}
          {step === 7 && (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
                <CheckCircle className="w-14 h-14 text-purple-600" />
                <div>
                  <p className="text-xl font-bold text-purple-900">{t.delegations.successTitle}</p>
                  <p className="text-sm text-purple-700 mt-1">
                    <strong>{draft.personName}</strong>{" "}
                    {draft.delegationType === "monitoring" ? t.delegations.monitoringOnlyDesc : t.delegations.actingOnBehalfDesc}{" "}
                    până la <strong>{format(validityDate, "dd.MM.yyyy")}</strong>.
                  </p>
                  <p className="text-xs text-purple-600 mt-2">{t.delegations.successNote}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-700">{t.delegations.permissionSummary}</p>
                {Object.entries(draft.permissions).map(([k, v]) => {
                  const permMap: Record<string, string> = {
                    viewNotifications: t.delegations.permissions.viewNotifications,
                    trackRequests: t.delegations.permissions.trackRequests,
                    createAppointments: t.delegations.permissions.createAppointments,
                    uploadFiles: t.delegations.permissions.uploadFiles,
                    makePayments: t.delegations.permissions.makePayments,
                    viewSensitiveData: t.delegations.permissions.viewSensitiveData,
                  };
                  return (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{permMap[k]}</span>
                      <span className={`text-xs font-medium ${v ? "text-green-600" : "text-slate-400"}`}>
                        {v ? t.delegations.permissionYes : t.delegations.permissionNo}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">{t.common.delegationLegal}</p>
              </div>

              <Button fullWidth size="lg" onClick={handleCreateDelegation} loading={loading}>
                Finalizează și salvează delegarea
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DelegationsScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  void brand;
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);

  const citizen = state.citizen;
  if (!citizen) return null;

  const isDelegate = state.currentRole === "delegate";
  const isCitizen = state.currentRole === "citizen";

  function handleRevoke(id: string) {
    if (!isCitizen) {
      showToast("Doar cetățeanul poate revoca delegări.", "error");
      return;
    }
    dispatch({ type: "REVOKE_DELEGATION", delegationId: id });
    addLedgerEvent("delegation.revoked", `Delegare revocată: ${id}`);
    showToast("Delegare revocată cu succes.", "success");
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {brand.delegationName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.delegations.title}
          </p>
        </div>
        {isCitizen && (
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t.delegations.create}
          </Button>
        )}
      </div>

      {isDelegate && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-purple-800">{t.delegations.delegateModeWarning}</p>
          <p className="text-xs text-purple-700 mt-1">{t.delegations.managedByNote}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-700 leading-relaxed">{t.common.delegationLegal}</p>
      </div>

      <div className="space-y-3">
        {citizen.delegations.map((del) => (
          <DelegationCard
            key={del.id}
            delegation={del}
            onRevoke={handleRevoke}
            canRevoke={isCitizen}
          />
        ))}
        {citizen.delegations.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{t.delegations.noActiveDelegations}</p>
            {!isDelegate && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                {t.delegations.createFirst}
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>

      {showCreate && <CreateDelegationFlow onClose={() => setShowCreate(false)} />}
    </div>
  );
}
