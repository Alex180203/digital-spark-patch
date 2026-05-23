import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/lazi-ui/Card";
import { useToast } from "../components/lazi-ui/Toast";
import type { StandingRuleKey } from "../types";

const RULE_LABELS: Record<StandingRuleKey, { title: string; desc: string }> = {
  auto_pay_local_taxes: {
    title: "Plată automată taxe locale",
    desc: "Statul achită automat taxele locale sub plafonul stabilit.",
  },
  auto_renew_documents: {
    title: "Reînnoire automată documente",
    desc: "CI, permis, pașaport — statul deschide singur dosarul cu 75 zile înainte de expirare.",
  },
  auto_accept_appointments: {
    title: "Acceptă programările propuse",
    desc: "Primești o programare la cel mai apropiat ghișeu. Poți schimba data oricând.",
  },
  auto_sign_declarations: {
    title: "Semnează declarații pre-completate",
    desc: "Declarațiile ANAF / Cadastru se semnează automat cu ROeID dacă datele se potrivesc.",
  },
  auto_accept_deliveries: {
    title: "Acceptă livrarea la adresă",
    desc: "CEI și alte documente sunt livrate la adresa din profil, fără drum la ghișeu.",
  },
};

export function RulesScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const { showToast } = useToast();

  function toggle(key: StandingRuleKey, enabled: boolean) {
    if (state.currentRole !== "citizen") {
      showToast("Doar cetățeanul poate modifica regulile.", "error");
      return;
    }
    dispatch({ type: "SET_STANDING_RULE", key, enabled });
    addLedgerEvent("rule.toggle", `${key} → ${enabled ? "on" : "off"}`);
    showToast(enabled ? "Regulă activată" : "Regulă dezactivată", "success");
  }

  const activeCount = state.standingRules.filter((r) => r.enabled).length;

  return (
    <div className="py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Cât de leneș vrei să fii?
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {activeCount} din {state.standingRules.length} reguli active. Statul acționează singur în limita acestor reguli.
        </p>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Pentru fiecare acțiune automată primești notificare și ai dreptul să schimbi, contești sau anulezi.
            Totul se înregistrează în ledgerul imutabil.
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {state.standingRules.map((rule) => {
          const meta = RULE_LABELS[rule.key];
          return (
            <Card key={rule.key}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{meta.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{meta.desc}</p>
                  {rule.cap !== undefined && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">Plafon: {rule.cap} RON</p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={rule.enabled}
                    onChange={(e) => toggle(rule.key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400">Date simulate — demo LaZi</p>
    </div>
  );
}
