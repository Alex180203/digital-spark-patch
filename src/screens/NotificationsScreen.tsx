import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, CalendarDays, MapPin, CheckCircle, AlertTriangle, FileText,
  CreditCard, Database, ChevronRight, RefreshCw, ShieldCheck,
} from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";
import type { Citizen, AppRequest, Document } from "../types";

const REQUIRED_DOCS: Record<string, string[]> = {
  identity_renewal: [
    "Actul de identitate actual (original)",
    "Certificat de naștere (original)",
    "Dovada adresei de domiciliu",
    "Dovada achitării taxei (dacă e cazul)",
  ],
  passport: [
    "Carte de identitate (original + copie)",
    "Certificat de naștere",
    "Dovada plății taxei de pașaport",
    "Pașaportul vechi (dacă există)",
  ],
  driving_license: [
    "Carte de identitate (original)",
    "Permisul de conducere vechi",
    "Aviz medical valabil",
    "Dovada plății taxei",
  ],
  fiscal_certificate: [
    "Carte de identitate (original)",
    "Cerere tip (se completează la ghișeu)",
  ],
  default: [
    "Carte de identitate (original)",
    "Documentele menționate în cerere",
  ],
};

type Tax = { id: string; label: string; institution: string; amount: string; dueDate: string; status: "due" | "overdue" | "paid" };

function mockTaxes(): Tax[] {
  return [
    { id: "tax-1", label: "Impozit clădire 2026 — rata 1", institution: "Primăria Cluj-Napoca", amount: "184 RON", dueDate: "2026-06-30", status: "due" },
    { id: "tax-2", label: "Impozit auto 2026", institution: "Primăria Cluj-Napoca", amount: "92 RON", dueDate: "2026-06-04", status: "due" },
    { id: "tax-3", label: "Amenda circulație", institution: "IPJ Cluj", amount: "290 RON", dueDate: "2026-05-15", status: "overdue" },
  ];
}

const SOURCES = [
  { name: "ANAF", desc: "Taxe & impozite" },
  { name: "DRPCIV", desc: "Permis & vehicule" },
  { name: "DEPABD", desc: "CI / CEI" },
  { name: "CNAS", desc: "Sănătate" },
  { name: "Primărie", desc: "Taxe locale" },
];

export function NotificationsScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const navigate = useNavigate();
  const citizen = state.citizen;
  if (!citizen) return null;

  const firstName = citizen.fullName.split(" ").pop() ?? citizen.fullName;
  const autoPayEnabled = state.standingRules.find((r) => r.key === "auto_pay_local_taxes")?.enabled ?? false;
  const taxes = autoPayEnabled ? [] : mockTaxes();
  const totalDue = taxes.filter((x) => x.status !== "paid").length;

  const expiringSoon = citizen.documents
    .filter((d) => d.daysUntilExpiry != null && d.daysUntilExpiry <= 90 && d.daysUntilExpiry >= -30)
    .sort((a, b) => (a.daysUntilExpiry ?? 0) - (b.daysUntilExpiry ?? 0));

  const upcoming = citizen.requests
    .filter((r) => r.appointment && new Date(r.appointment.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => (a.appointment!.date < b.appointment!.date ? -1 : 1));

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bună, {firstName}</h1>
        <p className="text-sm text-slate-500 mt-1">Tot ce ai cu statul, într-un singur loc. Nu trebuie să cauți nimic.</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Sincronizat acum din surse oficiale
        </div>
      </div>

      {/* Sources strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Surse conectate</p>
          <button className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 font-medium" onClick={() => location.reload()}>
            <RefreshCw className="w-3.5 h-3.5" /> Reîmprospătează
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold">{s.name}</span>
              <span className="text-slate-400">· {s.desc}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Papers to bring physically */}
      {upcoming.length > 0 && (
        <PhysicalPapers upcoming={upcoming} />
      )}

      {/* Taxes — hidden when auto-pay rule is active (state handles them automatically) */}
      {autoPayEnabled ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800">
            <p className="font-semibold">Taxele se plătesc automat</p>
            <p className="text-emerald-700 mt-0.5">Regula „Plată automată taxe locale" este activă. Dezactiveaz-o din <button onClick={() => navigate("/rules")} className="underline font-medium">Reguli</button> dacă vrei să le revezi aici.</p>
          </div>
        </div>
      ) : (
        <Section
          icon={<CreditCard className="w-5 h-5 text-white" />}
          color="bg-rose-600"
          title="Taxe & impozite de plătit"
          subtitle={`${totalDue} obligații aduse automat de la ANAF & Primărie`}
          action={{ label: "Plătește tot", onClick: () => navigate("/requests") }}
        >
          <div className="divide-y divide-slate-100">
            {taxes.map((tax) => (
              <div key={tax.id} className="py-2.5 flex items-center gap-3">
                <div className={`w-1.5 self-stretch rounded-full ${tax.status === "overdue" ? "bg-red-500" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{tax.label}</p>
                  <p className="text-xs text-slate-500">{tax.institution} · scadent {tax.dueDate}</p>
                </div>
                <p className={`text-sm font-bold ${tax.status === "overdue" ? "text-red-600" : "text-slate-900"}`}>{tax.amount}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Documents */}
      <Section
        icon={<FileText className="w-5 h-5 text-white" />}
        color="bg-blue-600"
        title="Documente care expiră"
        subtitle="Sincronizate din DEPABD, DRPCIV, CNAS, RAR"
        action={{ label: "Vezi toate", onClick: () => navigate("/documents") }}
      >
        {expiringSoon.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Toate documentele tale sunt la zi.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {expiringSoon.map((doc) => <DocRow key={doc.id} doc={doc} onClick={() => navigate("/documents")} />)}
          </div>
        )}
      </Section>

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>
    </div>
  );
}

function Section({
  icon, color, title, subtitle, action, children,
}: {
  icon: React.ReactNode; color: string; title: string; subtitle?: string;
  action?: { label: string; onClick: () => void }; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl ${color} grid place-items-center flex-shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action && (
          <button onClick={action.onClick} className="text-xs font-semibold text-blue-600 inline-flex items-center gap-0.5 flex-shrink-0">
            {action.label} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function DocRow({ doc, onClick }: { doc: Document; onClick: () => void }) {
  const days = doc.daysUntilExpiry ?? 0;
  const tone = days < 0 ? "text-red-600" : days <= 30 ? "text-amber-600" : "text-slate-600";
  const label = days < 0 ? `Expirat acum ${Math.abs(days)} zile` : `${days} zile rămase`;
  return (
    <button onClick={onClick} className="w-full py-2.5 flex items-center gap-3 text-left">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
        <p className="text-xs text-slate-500 truncate">{doc.institution}</p>
      </div>
      <span className={`text-xs font-semibold ${tone}`}>{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}

function PhysicalPapers({ upcoming }: { upcoming: AppRequest[] }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 grid place-items-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Acte de adus fizic la ghișeu</h2>
          <p className="text-xs text-slate-500">Pregătite automat pentru programările tale</p>
        </div>
      </div>
      <div className="space-y-3">
        {upcoming.map((r) => {
          const docs = REQUIRED_DOCS[r.type] ?? REQUIRED_DOCS.default;
          return (
            <div key={r.id} className="bg-white rounded-xl p-3 border border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{r.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{r.appointment!.date} · {r.appointment!.time}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.appointment!.office}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
