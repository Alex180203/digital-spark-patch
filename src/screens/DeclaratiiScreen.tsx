import React, { useState } from "react";
import { Sparkles, Check, Pencil, Wallet, Building2, Calendar, ShieldCheck, FileSignature } from "lucide-react";
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

const AUTOFILL: Field[] = [
  { id: "cnp", label: "CNP", value: "1850412080011", source: "ROeID · MAI", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "name", label: "Nume complet", value: "Andrei Popescu", source: "ROeID · MAI", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "addr", label: "Adresă fiscală", value: "Str. Memorandumului 12, Cluj-Napoca", source: "Direcția Evidența Persoanelor", icon: <Building2 className="w-4 h-4" /> },
  { id: "prop", label: "Proprietate impozabilă", value: "Apartament · 64 m² · zona B", source: "ANAF · Cadastru", icon: <Building2 className="w-4 h-4" /> },
  { id: "tax", label: "Impozit calculat 2026", value: "412 RON", source: "ANAF · grilă 2026", icon: <Wallet className="w-4 h-4" /> },
  { id: "due", label: "Scadență", value: "31 martie 2026", source: "ANAF", icon: <Calendar className="w-4 h-4" /> },
];

export function DeclaratiiScreen() {
  const { addLedgerEvent } = useApp();
  const { showToast } = useToast();
  const [fields, setFields] = useState(AUTOFILL);
  const [editing, setEditing] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  function update(id: string, value: string) {
    setFields((fs) => fs.map((f) => f.id === id ? { ...f, value, source: "editat manual" } : f));
  }

  function sign() {
    setSigned(true);
    addLedgerEvent("declaration.signed", "Declarație impozit 2026 semnată (autocompletată de stat, confirmată de cetățean)");
    showToast("Declarație trimisă către ANAF · 412 RON programați la plată", "success");
  }

  return (
    <div className="py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Declarații</h1>
        <p className="text-sm text-slate-500 mt-1">Statul completează, tu doar confirmi.</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Declarație impozit proprietate · 2026</div>
          <div className="text-xs text-blue-50 opacity-90 mt-0.5">
            6 câmpuri pre-completate din ANAF, Cadastru și ROeID. Verifică, editează dacă e cazul, semnează.
          </div>
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
                      <span>{f.value}</span>
                      {!signed && <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600" />}
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
            <div className="font-semibold text-emerald-900">Declarație trimisă · înregistrare #DCL-2026-44218</div>
            <div className="text-xs text-emerald-700">Plata 412 RON va fi efectuată automat din portofelul LaZi la 31 martie.</div>
          </div>
        </div>
      ) : (
        <Button fullWidth onClick={sign}>
          <FileSignature className="w-4 h-4" /> Confirmă și semnează cu ROeID
        </Button>
      )}

      <p className="text-center text-xs text-slate-400">Date simulate · pentru demo</p>
    </div>
  );
}
