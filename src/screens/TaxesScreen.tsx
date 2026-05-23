import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, RefreshCw, Radio, CreditCard, ShieldCheck, FileText,
  AlertTriangle, CheckCircle, Building2, Receipt, Download,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fetchAllTaxes, type AggregatedTaxes, type GovTax } from "../utils/mockGovApi";

type FilterKey = "all" | GovTax["source"];

export function TaxesScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [agg, setAgg] = useState<AggregatedTaxes | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [paid, setPaid] = useState<Record<string, boolean>>({});

  const autoPay = state.standingRules.find((r) => r.key === "auto_pay_local_taxes")?.enabled ?? false;

  const reload = React.useCallback(() => {
    setLoading(true);
    fetchAllTaxes().then((r) => { setAgg(r); setLoading(false); });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const filtered = useMemo(() => {
    if (!agg) return [];
    const t = filter === "all" ? agg.taxes : agg.taxes.filter((x) => x.source === filter);
    return t.filter((x) => !paid[x.id]);
  }, [agg, filter, paid]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const overdue = filtered.filter((t) => t.status === "overdue");

  const sourceTabs: Array<{ key: FilterKey; label: string; count: number }> = useMemo(() => {
    if (!agg) return [{ key: "all", label: "Toate", count: 0 }];
    const counts: Record<string, number> = {};
    agg.taxes.forEach((t) => { counts[t.source] = (counts[t.source] ?? 0) + 1; });
    return [
      { key: "all", label: "Toate", count: agg.taxes.length },
      { key: "ANAF", label: "ANAF", count: counts["ANAF"] ?? 0 },
      { key: "Ghișeul.ro", label: "Ghișeul.ro", count: counts["Ghișeul.ro"] ?? 0 },
      { key: "Primărie", label: "Primărie", count: counts["Primărie"] ?? 0 },
      { key: "DRPCIV", label: "DRPCIV", count: counts["DRPCIV"] ?? 0 },
      { key: "CNAS", label: "CNAS", count: counts["CNAS"] ?? 0 },
    ];
  }, [agg]);

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Taxe & impozite</h1>
        <p className="text-sm text-slate-500 mt-1">Tot ce datorezi statului, agregat din ANAF, Ghișeul.ro, Primărie, DRPCIV și CNAS.</p>
      </div>

      {/* Auto-pay banner */}
      {autoPay && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800">
            <p className="font-semibold">Plată automată activă</p>
            <p className="text-emerald-700 mt-0.5">Taxele locale se plătesc automat la scadență. Le poți revedea aici oricând.</p>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white p-5 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Total de plată</p>
            <p className="text-3xl font-bold mt-1">{loading ? "—" : `${total} RON`}</p>
            <p className="text-xs opacity-90 mt-1">
              {loading ? "Se sincronizează..." : `${filtered.length} obligații · ${overdue.length} restante`}
            </p>
          </div>
          <button
            onClick={reload}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Resincron.
          </button>
        </div>
        <button
          disabled={loading || filtered.length === 0}
          className="mt-4 w-full bg-white text-rose-700 font-bold py-2.5 rounded-xl text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-rose-50"
          onClick={() => {
            const next: Record<string, boolean> = { ...paid };
            filtered.forEach((t) => { next[t.id] = true; });
            setPaid(next);
          }}
        >
          <CreditCard className="w-4 h-4" /> Plătește tot prin Ghișeul.ro
        </button>
      </div>

      {/* Source filter tabs */}
      <div className="-mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sourceTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${filter === tab.key ? "opacity-70" : "text-slate-400"}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ANAF spotlight (when on ALL or ANAF tab) */}
      {(filter === "all" || filter === "ANAF") && agg && (
        <AnafCard agg={agg} />
      )}

      {/* Live source status */}
      {agg && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Stare surse oficiale</p>
          <div className="space-y-1">
            {agg.sources.map((s) => (
              <div key={s.source} className="flex items-center gap-2 text-xs">
                <Radio className={`w-3 h-3 ${s.ok ? "text-emerald-500" : "text-red-500"}`} />
                <span className="font-semibold text-slate-700 w-24">{s.source}</span>
                <span className="font-mono text-[10px] text-slate-400 flex-1 truncate">{s.endpoint}</span>
                <span className="text-slate-500">{s.latencyMs}ms · {s.taxes.length} item</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax list */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Sincronizare în paralel din 5 surse...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">Nicio obligație neachitată</p>
            <p className="text-xs text-slate-500 mt-1">Toate taxele tale sunt la zi pentru această sursă.</p>
          </div>
        ) : (
          filtered.map((tax) => (
            <TaxCard
              key={tax.id}
              tax={tax}
              onPay={() => setPaid((p) => ({ ...p, [tax.id]: true }))}
            />
          ))
        )}
      </div>

      <p className="text-center text-xs text-slate-400">Date simulate · MVP — agregator național de obligații fiscale</p>
    </div>
  );
}

function AnafCard({ agg }: { agg: AggregatedTaxes }) {
  const anaf = agg.sources.find((s) => s.source === "ANAF");
  if (!anaf) return null;
  const total = anaf.taxes.reduce((s, t) => s + t.amount, 0);
  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 grid place-items-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">ANAF — Spațiul Privat Virtual</h3>
            <span className="text-[10px] font-mono bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded">SPV</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">Conectat automat · ultimele obligații preluate la {new Date(anaf.fetchedAt).toLocaleTimeString("ro-RO")}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <p className="text-[10px] text-slate-500 uppercase">Obligații</p>
              <p className="text-base font-bold text-slate-900">{anaf.taxes.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <p className="text-[10px] text-slate-500 uppercase">Sumă datorată</p>
              <p className="text-base font-bold text-slate-900">{total} RON</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 text-xs font-semibold bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Vezi declarații
            </button>
            <button className="text-xs font-semibold bg-white text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 inline-flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Fișa rol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxCard({ tax, onPay }: { tax: GovTax; onPay: () => void }) {
  const overdue = tax.status === "overdue";
  return (
    <div className={`rounded-xl border bg-white p-3 ${overdue ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 ${overdue ? "bg-red-100" : "bg-slate-100"}`}>
          {overdue ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Receipt className="w-4 h-4 text-slate-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{tax.label}</p>
            <p className={`text-sm font-bold whitespace-nowrap ${overdue ? "text-red-600" : "text-slate-900"}`}>{tax.amount} RON</p>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{tax.institution} · scadent {tax.dueDate}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
              {tax.source}
            </span>
            {tax.legalRef && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] border border-slate-200">
                {tax.legalRef}
              </span>
            )}
            {overdue && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-semibold border border-red-200">
                Restant
              </span>
            )}
          </div>
          <button
            onClick={onPay}
            className="mt-2 w-full text-xs font-semibold bg-slate-900 text-white py-1.5 rounded-lg hover:bg-slate-800 inline-flex items-center justify-center gap-1"
          >
            <CreditCard className="w-3.5 h-3.5" /> Plătește {tax.amount} RON
          </button>
        </div>
      </div>
    </div>
  );
}
