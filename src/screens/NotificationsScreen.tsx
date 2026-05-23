import React, { useState } from "react";
import { Bell, AlertTriangle, Info, CheckCircle, ChevronRight, Calendar as CalIcon, Flag, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp, useTranslations } from "../context/AppContext";
import { Badge } from "../components/lazi-ui/Badge";
import { Button } from "../components/lazi-ui/Button";
import { useToast } from "../components/lazi-ui/Toast";
import type { Notification, NotificationOverrideStatus } from "../types";

function statusBadge(status?: NotificationOverrideStatus) {
  if (!status || status === "pending") return null;
  const map: Record<Exclude<NotificationOverrideStatus, "pending">, { label: string; cls: string }> = {
    accepted: { label: "Acceptat", cls: "bg-emerald-100 text-emerald-700" },
    changed: { label: "Reprogramat", cls: "bg-blue-100 text-blue-700" },
    disputed: { label: "Contestat", cls: "bg-red-100 text-red-700" },
    snoozed: { label: "Amânat", cls: "bg-slate-100 text-slate-700" },
  };
  const m = map[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

function NotificationItem({
  notif,
  onRead,
  onOverride,
  ctaRoute,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onOverride: (id: string, status: NotificationOverrideStatus, note?: string) => void;
  ctaRoute?: string;
}) {
  const t = useTranslations();
  const navigate = useNavigate();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeText, setDisputeText] = useState("");

  const priorityConfig = {
    urgent: { badge: "urgent" as const, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: "bg-red-100", label: t.notifications.priority.urgent },
    attention: { badge: "attention" as const, icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100", label: t.notifications.priority.attention },
    info: { badge: "info" as const, icon: <Info className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100", label: t.notifications.priority.info },
  };

  const config = priorityConfig[notif.priority];
  const hasVerbs = (notif.verbs?.length ?? 0) > 0 && notif.overrideStatus === "pending";

  return (
    <div className={`rounded-2xl border p-4 transition-all ${notif.read ? "bg-white border-slate-100 opacity-80" : "bg-white border-slate-200 shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" aria-label="Unread" />}
            <Badge variant={config.badge}>{config.label}</Badge>
            {statusBadge(notif.overrideStatus)}
            <span className="text-xs text-slate-400 ml-auto">{notif.date}</span>
          </div>
          <p className="font-semibold text-slate-900 text-sm">{notif.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{notif.source}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

          {notif.proposedAction && (
            <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-700">Statul propune</p>
              <p className="text-xs text-slate-700 mt-0.5">{notif.proposedAction}</p>
              {notif.autoAcceptAt && (
                <p className="text-[11px] text-blue-600 mt-1">⏳ Se acceptă automat pe {notif.autoAcceptAt}</p>
              )}
            </div>
          )}

          {hasVerbs && (
            <div className="flex flex-wrap gap-2 mt-3">
              {notif.verbs?.includes("accept") && (
                <Button size="sm" onClick={() => onOverride(notif.id, "accepted")}>
                  <CheckCircle className="w-3.5 h-3.5" /> Accept
                </Button>
              )}
              {notif.verbs?.includes("change") && (
                <Button variant="secondary" size="sm" onClick={() => { onOverride(notif.id, "changed", "Reprogramat din calendar"); navigate("/calendar"); }}>
                  <CalIcon className="w-3.5 h-3.5" /> Schimbă data
                </Button>
              )}
              {notif.verbs?.includes("snooze") && (
                <Button variant="secondary" size="sm" onClick={() => onOverride(notif.id, "snoozed", "Amânat 7 zile")}>
                  <Clock className="w-3.5 h-3.5" /> Amână 7z
                </Button>
              )}
              {notif.verbs?.includes("dispute") && (
                <Button variant="ghost" size="sm" onClick={() => setDisputeOpen((v) => !v)}>
                  <Flag className="w-3.5 h-3.5" /> Contestă
                </Button>
              )}
            </div>
          )}

          {disputeOpen && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 space-y-2">
              <textarea
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Motivul contestației..."
                className="w-full text-xs p-2 border border-red-200 rounded-md bg-white"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { onOverride(notif.id, "disputed", disputeText || "Contestat fără motiv"); setDisputeOpen(false); setDisputeText(""); }}>
                  Trimite contestația
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDisputeOpen(false)}>Anulează</Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {!notif.read && !hasVerbs && (
              <Button variant="secondary" size="sm" onClick={() => onRead(notif.id)}>
                <CheckCircle className="w-3.5 h-3.5" /> {t.actions.markRead}
              </Button>
            )}
            {notif.cta && (
              <Button variant="ghost" size="sm" onClick={() => ctaRoute && navigate(ctaRoute)}>
                {notif.cta} <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCtaRoute(notif: Notification): string | undefined {
  if (!notif.relatedEntityType) return undefined;
  if (notif.relatedEntityType === "request") return "/requests";
  if (notif.relatedEntityType === "document") return "/documents";
  return undefined;
}

export function NotificationsScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();

  const citizen = state.citizen;
  if (!citizen) return null;

  const isDelegate = state.currentRole === "delegate";
  const activeDelegation = citizen.delegations.find((d) => d.status === "active");

  const notifications = isDelegate && activeDelegation
    ? citizen.notifications.filter((n) => {
        if (activeDelegation.permissions.viewNotifications) return true;
        return n.relatedEntityType === "request" && activeDelegation.permissions.trackRequests;
      })
    : citizen.notifications;

  function markRead(id: string) {
    dispatch({ type: "MARK_NOTIFICATION_READ", id });
    addLedgerEvent("notification.read", `Notification marked read: ${id}`);
  }

  function applyOverride(id: string, status: import("../types").NotificationOverrideStatus, note?: string) {
    dispatch({ type: "APPLY_NOTIFICATION_OVERRIDE", id, status, note });
    addLedgerEvent("notification.override", `${id} → ${status}${note ? ` (${note})` : ""}`);
    const labels: Record<string, string> = { accepted: "Acceptat", changed: "Reprogramat", disputed: "Contestație trimisă", snoozed: "Amânat 7 zile" };
    showToast(labels[status] ?? "Actualizat", "success");
  }


  function markAllRead() {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
    addLedgerEvent("notification.all_read", "All notifications marked as read");
    showToast(t.notifications.allRead, "success");
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.notifications.title}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} {t.notifications.unread}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            {t.notifications.markAllRead}
          </Button>
        )}
      </div>

      {isDelegate && (
        <p className="text-xs text-amber-600 font-medium">{t.notifications.delegateFilterNote}</p>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t.notifications.noNotifications}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onRead={markRead}
              onOverride={applyOverride}
              ctaRoute={getCtaRoute(notif)}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>
    </div>
  );
}
