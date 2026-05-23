import React, { useState } from "react";
import {
  Sparkles, Check, Pencil, Wallet, Building2, Calendar, ShieldCheck, FileSignature,
  FileText, Briefcase, Car, GraduationCap, Heart,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Button } from "../components/lazi-ui/Button";
import { useToast } from "../components/lazi-ui/Toast";

type Field = {
  id: string;
  label: string;
  value: string;
  source: string;
  icon: React.ReactNode;
};

type FormTemplate = {
  key: string;
  name: string;
  code: string;
  institution: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  fields: Field[];
};

const SHIELD = <ShieldCheck className="w-4 h-4" />;
const BUILD = <Building2 className="w-4 h-4" />;
const WALL = <Wallet className="w-4 h-4" />;
const CAL = <Calendar className="w-4 h-4" />;

const TEMPLATES: FormTemplate[] = [
  {
    key: "impozit_local",
    name: "Declarație impozit proprietate",
    code: "ITL-001 · 2026",
    institution: "Primăria Cluj-Napoca",
    description: "6 câmpuri pre-completate din ANAF, Cadastru și ROeID.",
    icon: <Building2 className="w-5 h-5" />,
    accent: "from-blue-600 to-blue-500",
    fields: [
      { id: "cnp", label: "CNP", value: "1850412080011", source: "ROeID · MAI", icon: SHIELD },
      { id: "name", label: "Nume complet", value: "Răzvan Panaite", source: "ROeID · MAI", icon: SHIELD },
      { id: "addr", label: "Adresă fiscală", value: "Str. Memorandumului 28, Cluj-Napoca", source: "Evidența Persoanelor", icon: BUILD },
      { id: "prop", label: "Proprietate impozabilă", value: "Apartament · 64 m² · zona B", source: "ANAF · Cadastru", icon: BUILD },
      { id: "tax", label: "Impozit calculat 2026", value: "412 RON", source: "ANAF · grilă 2026", icon: WALL },
      { id: "due", label: "Scadență", value: "31 martie 2026", source: "ANAF", icon: CAL },
    ],
  },
  {
    key: "declaratia_unica",
    name: "Declarația Unică (D212)",
    code: "ANAF · D212 · 2026",
    institution: "ANAF",
    description: "Venituri PFA, dividende, chirii, plus CAS/CASS — totul pre-completat.",
    icon: <Briefcase className="w-5 h-5" />,
    accent: "from-emerald-600 to-emerald-500",
    fields: [
      { id: "cnp", label: "CNP", value: "1850412080011", source: "ROeID · MAI", icon: SHIELD },
      { id: "venit_pfa", label: "Venit net PFA 2025", value: "84.200 RON", source: "ANAF · facturi e-Factura", icon: WALL },
      { id: "chirii", label: "Venituri din chirii", value: "12.000 RON", source: "ANAF · contracte ANAF", icon: BUILD },
      { id: "dividende", label: "Dividende SRL", value: "6.500 RON", source: "ONRC · ANAF", icon: WALL },
      { id: "cas", label: "CAS (25%)", value: "12.000 RON · 12 salarii minime", source: "ANAF · calcul automat", icon: ShieldCheck && <ShieldCheck className="w-4 h-4" /> },
      { id: "cass", label: "CASS (10%)", value: "4.800 RON", source: "CNAS · ANAF", icon: <Heart className="w-4 h-4" /> },
      { id: "impozit", label: "Impozit pe venit (10%)", value: "10.270 RON", source: "ANAF", icon: WALL },
      { id: "scad", label: "Scadență", value: "25 mai 2026", source: "ANAF", icon: CAL },
    ],
  },
  {
    key: "impozit_auto",
    name: "Declarație impozit auto",
    code: "ITL-005 · 2026",
    institution: "Primăria Cluj-Napoca",
    description: "Date din DRPCIV + CNAIR, calculat automat după capacitate cilindrică.",
    icon: <Car className="w-5 h-5" />,
    accent: "from-orange-600 to-orange-500",
    fields: [
      { id: "cnp", label: "CNP", value: "1850412080011", source: "ROeID · MAI", icon: SHIELD },
      { id: "auto", label: "Vehicul", value: "Skoda Octavia · CJ-12-ABC", source: "DRPCIV", icon: <Car className="w-4 h-4" /> },
      { id: "cc", label: "Capacitate cilindrică", value: "1968 cmc", source: "DRPCIV", icon: <Car className="w-4 h-4" /> },
      { id: "tax", label: "Impozit anual", value: "168 RON", source: "Primărie · grilă 2026", icon: WALL },
      { id: "due", label: "Scadență", value: "31 martie 2026", source: "Primărie", icon: CAL },
    ],
  },
  {
    key: "alocatie_copil",
    name: "Cerere alocație de stat",
    code: "AJPIS · 2026",
    institution: "AJPIS Cluj",
    description: "Date copil din SIRUP, IBAN părinte din ROeID Wallet.",
    icon: <GraduationCap className="w-5 h-5" />,
    accent: "from-purple-600 to-purple-500",
    fields: [
      { id: "parent", label: "Părinte solicitant", value: "Răzvan Panaite", source: "ROeID", icon: SHIELD },
      { id: "copil", label: "Copil", value: "Maria Panaite · CNP 6********", source: "SIRUP · Stare civilă", icon: <GraduationCap className="w-4 h-4" /> },
      { id: "varsta", label: "Vârstă", value: "4 ani · grupă mijlocie", source: "SIRUP", icon: CAL },
      { id: "scoala", label: "Unitate școlară", value: "Grădinița nr. 3 Cluj", source: "MEN · SIIIR", icon: <GraduationCap className="w-4 h-4" /> },
      { id: "iban", label: "IBAN încasare", value: "RO** BTRL **** **** 0124", source: "ROeID Wallet", icon: WALL },
      { id: "suma", label: "Sumă lunară", value: "292 RON", source: "AJPIS · grilă 2026", icon: WALL },
    ],
  },
  {
    key: "cnas",
    name: "Declarație asigurare CNAS",
    code: "CNAS-D · 2026",
    institution: "CNAS",
    description: "Status asigurat preluat din ANAF + angajator + AJOFM.",
    icon: <Heart className="w-5 h-5" />,
    accent: "from-pink-600 to-pink-500",
    fields: [
      { id: "cnp", label: "CNP", value: "1850412080011", source: "ROeID", icon: SHIELD },
      { id: "status", label: "Status asigurat", value: "Asigurat · angajat full-time", source: "ANAF · D112", icon: SHIELD },
      { id: "ang", label: "Angajator", value: "Tech SRL · CUI RO12345678", source: "ONRC · ANAF", icon: BUILD },
      { id: "medic", label: "Medic familie", value: "Dr. Ioana Marcu · Cluj-Napoca", source: "CNAS", icon: <Heart className="w-4 h-4" /> },
      { id: "card", label: "Card sănătate", value: "Activ · valabil până 2029", source: "CNAS", icon: ShieldCheck && <ShieldCheck className="w-4 h-4" /> },
    ],
  },
];

function FormView({ template, onSign }: { template: FormTemplate; onSign: (t: FormTemplate) => void }) {
  const [fields, setFields] = useState(template.fields);
  const [editing, setEditing] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  function update(id: string, value: string) {
    setFields((fs) => fs.map((f) => f.id === id ? { ...f, value, source: "editat manual" } : f));
  }

  function handleSign() {
    setSigned(true);
    onSign(template);
  }

  return (
    <>
      <div className={`rounded-2xl bg-gradient-to-br ${template.accent} text-white p-4 flex items-start gap-3`}>
        <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
          {template.icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{template.name}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-80 mt-0.5">{template.code} · {template.institution}</div>
          <div className="text-xs opacity-90 mt-1">{template.description}</div>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 grid place-items-center shrink-0">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{f.label}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <Check className="w-3 h-3" /> {f.source}
                    </span>
                  </div>
                  {editing === f.id ? (
                    <input
                      autoFocus
                      value={f.value}
                      onChange={(e) => update(f.id, e.target.value)}
                      onBlur={() => setEditing(null)}
                      className="mt-1 w-full px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <button
                      onClick={() => !signed && setEditing(f.id)}
                      className="mt-0.5 w-full text-left text-sm font-medium text-slate-900 flex items-center justify-between gap-2 group"
                    >
                      <span className="break-words">{f.value}</span>
                      {!signed && <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {signed ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 grid place-items-center text-white">
            <Check className="w-5 h-5" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-emerald-900">Declarație trimisă · #{template.key.toUpperCase()}-{Math.floor(Math.random() * 90000) + 10000}</div>
            <div className="text-xs text-emerald-700">Confirmare automată către {template.institution}.</div>
          </div>
        </div>
      ) : (
        <Button fullWidth onClick={handleSign}>
          <FileSignature className="w-4 h-4" /> Confirmă și semnează cu ROeID
        </Button>
      )}
    </>
  );
}

export function DeclaratiiScreen() {
  const { addLedgerEvent } = useApp();
  const { showToast } = useToast();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const active = TEMPLATES.find((t) => t.key === activeKey);

  function onSign(t: FormTemplate) {
    addLedgerEvent("declaration.signed", `${t.name} semnată (autocompletată de stat)`);
    showToast(`${t.name} trimisă către ${t.institution}`, "success");
  }

  return (
    <div className="py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Declarații</h1>
        <p className="text-sm text-slate-500 mt-1">Statul completează, tu doar confirmi.</p>
      </div>

      {!active && (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Autocompletare integrată</div>
              <div className="text-xs opacity-90 mt-0.5">
                ANAF, CNAS, Cadastru, DRPCIV, ROeID și SIRUP — toate sursele oficiale completează automat formularele.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">Formulare disponibile</div>
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all p-4 flex items-start gap-3"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.accent} text-white grid place-items-center shrink-0`}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{t.code}</div>
                  <div className="text-xs text-slate-500 mt-1">{t.description}</div>
                  <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="w-3 h-3" /> {t.fields.length} câmpuri pre-completate
                  </div>
                </div>
                <FileText className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </>
      )}

      {active && (
        <>
          <button
            onClick={() => setActiveKey(null)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            ← Înapoi la formulare
          </button>
          <FormView template={active} onSign={onSign} />
        </>
      )}

      <p className="text-center text-xs text-slate-400">Date simulate · pentru demo</p>
    </div>
  );
}
