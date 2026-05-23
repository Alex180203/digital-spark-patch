import React from "react";
import { Shield, Lock, Hash } from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";

function truncateHash(hash: string) {
  if (hash.length <= 20) return hash;
  return hash.slice(0, 10) + "..." + hash.slice(-8);
}

const actionLabels: Record<string, { label: string; color: string }> = {
  "auth.roeid_login_success": { label: "Login ROeID", color: "bg-blue-100 text-blue-700" },
  "auth.two_factor_verified": { label: "2FA Verificat", color: "bg-blue-100 text-blue-700" },
  "auth.cei_nfc_demo_success": { label: "Login CEI NFC", color: "bg-cyan-100 text-cyan-700" },
  "notification.read": { label: "Notificare citită", color: "bg-slate-100 text-slate-600" },
  "notification.all_read": { label: "Toate notif. citite", color: "bg-slate-100 text-slate-600" },
  "request.created": { label: "Cerere creată", color: "bg-green-100 text-green-700" },
  "request.appointment_selected": { label: "Programare selectată", color: "bg-purple-100 text-purple-700" },
  "request.status_updated": { label: "Status actualizat", color: "bg-amber-100 text-amber-700" },
  "delegation.created": { label: "Delegare creată", color: "bg-purple-100 text-purple-700" },
  "delegation.signed_with_roeid_demo": { label: "Semnat ROeID", color: "bg-blue-100 text-blue-700" },
  "delegation.signed_with_cei_demo": { label: "Semnat CEI NFC", color: "bg-cyan-100 text-cyan-700" },
  "delegation.revoked": { label: "Delegare revocată", color: "bg-red-100 text-red-700" },
  "settings.language_changed": { label: "Limbă schimbată", color: "bg-slate-100 text-slate-600" },
  "settings.role_switched": { label: "Rol schimbat", color: "bg-slate-100 text-slate-600" },
  "document.reminder_added": { label: "Reminder adăugat", color: "bg-green-100 text-green-700" },
};

export function LedgerScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const ledger = [...state.ledger].reverse();

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.ledger.title}</h1>
          <p className="text-xs text-slate-500">{ledger.length} {t.ledger.eventsCount}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-medium">{t.common.ledgerActive} — {t.ledger.immutableNote}</span>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">{t.ledger.note}</p>
        <p className="text-slate-400 text-xs">{t.ledger.immutableNote}</p>
      </div>

      {ledger.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t.ledger.noEvents}</p>
          <p className="text-xs mt-1">{t.ledger.noEventsHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ledger.map((event) => {
            const config = actionLabels[event.action];
            return (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config?.color ?? "bg-slate-100 text-slate-600"}`}>
                    {config?.label ?? event.action}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mb-2 leading-relaxed">{event.payloadSummary}</p>

                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{t.ledger.id_label}</span>
                    <span className="text-[10px] text-slate-600">{event.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{t.ledger.actor_label}</span>
                    <span className="text-[10px] text-slate-600">{event.actorId} ({event.actorRole})</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{t.ledger.hashPrev}</span>
                    <span className="text-[10px] text-slate-500 break-all">{truncateHash(event.previousHash)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{t.ledger.hashCurrent}</span>
                    <span className="text-[10px] text-blue-600 break-all font-medium">{truncateHash(event.currentHash)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>
    </div>
  );
}
