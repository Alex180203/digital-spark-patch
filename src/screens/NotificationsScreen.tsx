import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, CalendarDays, MapPin, CheckCircle, FileText, ChevronDown, ChevronUp,
  CreditCard, Database, ChevronRight, RefreshCw, ShieldCheck, Clock, X, Edit3, Sparkles,
  Loader2, Radio,
} from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";
import type { AppRequest, Document } from "../types";
import { fetchAllTaxes, type AggregatedTaxes } from "../utils/mockGovApi";

/**
 * Required & legal documents per Romanian legislation (sources noted).
 * Kept as readable lists for an MVP — these mirror the official lists from
 * DEPABD, DGP (pașapoarte), DRPCIV, ANAF and primării.
 */
type DocSpec = { label: string; legal: string };
const LEGAL_DOCS: Record<string, { title: string; law: string; required: DocSpec[]; optional?: DocSpec[] }> = {
  identity_renewal: {
    title: "Carte de identitate (buletin)",
    law: "OUG 97/2005 privind evidența, domiciliul, reședința și actele de identitate",
    required: [
      { label: "Cerere tip pentru eliberarea actului de identitate", legal: "Anexa 1, HG 295/2021" },
      { label: "Actul de identitate anterior (sau declarație de pierdere/furt)", legal: "Art. 15 OUG 97/2005" },
      { label: "Certificat de naștere — original și copie", legal: "Art. 15 lit. b OUG 97/2005" },
      { label: "Dovada adresei de domiciliu (act proprietate / contract / declarație gazdă)", legal: "Art. 27 OUG 97/2005" },
      { label: "Chitanță taxă 7 RON (CI simplă) sau 67 RON (CEI)", legal: "OUG 41/2016" },
    ],
    optional: [
      { label: "Certificat de căsătorie (dacă e cazul)", legal: "Art. 15 lit. c OUG 97/2005" },
      { label: "Hotărâre de divorț definitivă (dacă e cazul)", legal: "Art. 15 lit. d OUG 97/2005" },
    ],
  },
  passport: {
    title: "Pașaport simplu electronic",
    law: "Legea 248/2005 privind regimul liberei circulații a cetățenilor români",
    required: [
      { label: "Carte de identitate valabilă — original", legal: "Art. 16 alin. (1) Legea 248/2005" },
      { label: "Pașaportul anterior (dacă există)", legal: "Art. 18 Legea 248/2005" },
      { label: "Dovada plății taxei de 258 RON (pașaport electronic, adult)", legal: "OUG 41/2016 anexa 4" },
      { label: "Fotografie biometrică se face la ghișeu", legal: "Art. 17 Legea 248/2005" },
    ],
    optional: [
      { label: "Acordul ambilor părinți (pentru minori sub 18 ani)", legal: "Art. 17^1 Legea 248/2005" },
    ],
  },
  driving_license: {
    title: "Permis de conducere",
    law: "OUG 195/2002 privind circulația pe drumurile publice",
    required: [
      { label: "Cerere tip", legal: "Anexa Ord. MAI 268/2010" },
      { label: "Carte de identitate — original și copie", legal: "Art. 24 OUG 195/2002" },
      { label: "Permisul de conducere anterior (preschimbare)", legal: "Art. 24^1 OUG 195/2002" },
      { label: "Fișa medicală tip avizată (cabinet autorizat)", legal: "Ord. MS 1162/2010" },
      { label: "Dovada plății taxei 89 RON", legal: "OUG 41/2016" },
    ],
  },
  fiscal_certificate: {
    title: "Certificat de atestare fiscală",
    law: "Codul de procedură fiscală (Legea 207/2015), art. 158",
    required: [
      { label: "Cerere tip (se completează la ghișeu sau prin SPV)", legal: "Anexa Ord. ANAF 3654/2015" },
      { label: "Carte de identitate — original", legal: "Art. 158 Cod proc. fiscală" },
    ],
    optional: [
      { label: "Împuternicire notarială (dacă reprezentați pe altcineva)", legal: "Art. 18 Cod proc. fiscală" },
    ],
  },
  default: {
    title: "Documente generale",
    law: "Conform reglementărilor instituției emitente",
    required: [
      { label: "Carte de identitate — original", legal: "—" },
      { label: "Documentele specificate în cerere", legal: "—" },
    ],
  },
};


type ProposedAppointment = {
  id: string;
  reqType: string;
  reason: string;
  date: string;
  time: string;
  office: string;
  autoAcceptIn: string; // human readable
};

function mockProposed(citizenDocs: Document[]): ProposedAppointment[] {
  // Find expiring ID/passport/license and propose a slot
  const proposals: ProposedAppointment[] = [];
  const ci = citizenDocs.find((d) => d.type === "identity" && (d.daysUntilExpiry ?? 999) <= 90);
  if (ci) proposals.push({
    id: "prop-ci", reqType: "identity_renewal",
    reason: `Buletinul tău expiră în ${ci.daysUntilExpiry} zile`,
    date: "2026-06-12", time: "10:30", office: "SPCLEP Cluj-Napoca, str. Moților 7",
    autoAcceptIn: "3 zile",
  });
  const pas = citizenDocs.find((d) => d.type === "passport" && (d.daysUntilExpiry ?? 999) <= 180);
  if (pas) proposals.push({
    id: "prop-pas", reqType: "passport",
    reason: `Pașaportul expiră în ${pas.daysUntilExpiry} zile`,
    date: "2026-07-02", time: "09:15", office: "Serviciul Pașapoarte Cluj, Calea Dorobanților 81",
    autoAcceptIn: "5 zile",
  });
  return proposals;
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

  const [decisions, setDecisions] = useState<Record<string, "accepted" | "declined" | undefined>>({});
  const [openLegal, setOpenLegal] = useState<string | null>(null);
  const [agg, setAgg] = useState<AggregatedTaxes | null>(null);
  const [loadingTaxes, setLoadingTaxes] = useState(true);

  const reloadTaxes = React.useCallback(() => {
    setLoadingTaxes(true);
    fetchAllTaxes().then((r) => { setAgg(r); setLoadingTaxes(false); });
  }, []);
  useEffect(() => { reloadTaxes(); }, [reloadTaxes]);

  if (!citizen) return null;

  const firstName = citizen.fullName.split(" ").pop() ?? citizen.fullName;
  const autoPayEnabled = state.standingRules.find((r) => r.key === "auto_pay_local_taxes")?.enabled ?? false;
  const autoAcceptEnabled = state.standingRules.find((r) => r.key === "auto_accept_appointments")?.enabled ?? false;

  const taxes = autoPayEnabled ? [] : (agg?.taxes ?? []);
  const totalDue = taxes.filter((x) => x.status !== "paid").length;
  const totalAmount = taxes.filter((x) => x.status !== "paid").reduce((s, x) => s + x.amount, 0);

  const proposed = mockProposed(citizen.documents).filter((p) => !decisions[p.id]);

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
        <p className="text-sm text-slate-500 mt-1">Statul îți pregătește totul. Tu doar confirmi.</p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Sincronizat acum din surse oficiale
        </div>
      </div>

      {/* Surse — live mock API status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Surse conectate</p>
          <button
            disabled={loadingTaxes}
            className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 font-medium disabled:opacity-50"
            onClick={reloadTaxes}
          >
            {loadingTaxes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loadingTaxes ? "Sincronizare..." : "Reîmprospătează"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map((s) => {
            const live = agg?.sources.find((x) => x.source === s.name);
            const ok = live?.ok ?? false;
            return (
              <span key={s.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700" title={live?.endpoint}>
                {loadingTaxes ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" />
                ) : (
                  <Radio className={`w-2.5 h-2.5 ${ok ? "text-emerald-500" : "text-slate-300"}`} />
                )}
                <span className="font-semibold">{s.name}</span>
                <span className="text-slate-400">· {s.desc}</span>
                {live && <span className="text-slate-400">· {live.latencyMs}ms</span>}
              </span>
            );
          })}
        </div>
        {agg && (
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            GET /aggregator/v1/citizen/me · {agg.sources.length} surse · {agg.taxes.length} obligații
          </p>
        )}
      </div>

      {/* Proposed appointments — lazy citizen flow */}
      {proposed.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 grid place-items-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Programări propuse pentru tine</h2>
              <p className="text-xs text-slate-500">
                {autoAcceptEnabled ? "Se acceptă automat dacă nu intervii." : "Confirmă, mută sau respinge."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {proposed.map((p) => {
              const spec = LEGAL_DOCS[p.reqType] ?? LEGAL_DOCS.default;
              const isOpen = openLegal === p.id;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{spec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.reason}</p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{p.date} · {p.time}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{p.office}</span>
                  </div>

                  {!autoAcceptEnabled && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" /> Se acceptă automat în {p.autoAcceptIn} dacă nu răspunzi
                    </p>
                  )}

                  {/* Legal docs dropdown */}
                  <button
                    onClick={() => setOpenLegal(isOpen ? null : p.id)}
                    className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Acte necesare conform legii
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isOpen && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-[11px] text-slate-500 italic mb-2">Bază legală: {spec.law}</p>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Obligatoriu</p>
                      <ul className="space-y-1.5 mb-2">
                        {spec.required.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">
                              {d.label}
                              <span className="block text-[10px] text-slate-400">{d.legal}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      {spec.optional && spec.optional.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-slate-700 mb-1 mt-2">Doar dacă e cazul</p>
                          <ul className="space-y-1.5">
                            {spec.optional.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600">
                                  {d.label}
                                  <span className="block text-[10px] text-slate-400">{d.legal}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setDecisions((d) => ({ ...d, [p.id]: "accepted" }))}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Da, e ok
                    </button>
                    <button
                      onClick={() => navigate("/requests")}
                      className="inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Mută
                    </button>
                    <button
                      onClick={() => setDecisions((d) => ({ ...d, [p.id]: "declined" }))}
                      className="inline-flex items-center justify-center gap-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" /> Nu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!autoAcceptEnabled && (
            <button
              onClick={() => navigate("/rules")}
              className="mt-3 w-full text-center text-xs text-violet-700 font-medium hover:underline"
            >
              Vrei să accept automat toate propunerile? Activează regula →
            </button>
          )}
        </div>
      )}

      {/* Confirmed upcoming */}
      {upcoming.length > 0 && <PhysicalPapers upcoming={upcoming} />}

      {/* Taxes */}
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
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 grid place-items-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Programări confirmate</h2>
          <p className="text-xs text-slate-500">Cu lista oficială de acte necesare</p>
        </div>
      </div>
      <div className="space-y-3">
        {upcoming.map((r) => {
          const spec = LEGAL_DOCS[r.type] ?? LEGAL_DOCS.default;
          const isOpen = open === r.id;
          return (
            <div key={r.id} className="bg-white rounded-xl p-3 border border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{r.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{r.appointment!.date} · {r.appointment!.time}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{r.appointment!.office}</span>
              </div>
              <button
                onClick={() => setOpen(isOpen ? null : r.id)}
                className="mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700"
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Acte de adus ({spec.required.length})
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isOpen && (
                <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 italic mb-2">Bază legală: {spec.law}</p>
                  <ul className="space-y-1.5">
                    {spec.required.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">
                          {d.label}
                          <span className="block text-[10px] text-slate-400">{d.legal}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
