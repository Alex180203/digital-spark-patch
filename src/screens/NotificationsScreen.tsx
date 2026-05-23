import React from "react";
import { Bell, AlertTriangle, Info, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp, useTranslations } from "../context/AppContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import type { Notification } from "../types";

function NotificationItem({
  notif,
  onRead,
  ctaRoute,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  ctaRoute?: string;
}) {
  const t = useTranslations();
  const navigate = useNavigate();

  const priorityConfig = {
    urgent: {
      badge: "urgent" as const,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      bg: "bg-red-100",
      label: t.notifications.priority.urgent,
    },
    attention: {
      badge: "attention" as const,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-100",
      label: t.notifications.priority.attention,
    },
    info: {
      badge: "info" as const,
      icon: <Info className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-100",
      label: t.notifications.priority.info,
    },
  };

  const config = priorityConfig[notif.priority];

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        notif.read
          ? "bg-white border-slate-100 opacity-70"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!notif.read && (
              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" aria-label="Unread" />
            )}
            <Badge variant={config.badge}>{config.label}</Badge>
            <span className="text-xs text-slate-400 ml-auto">{notif.date}</span>
          </div>
          <p className="font-semibold text-slate-900 text-sm">{notif.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{notif.source}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

          <div className="flex gap-2 mt-3">
            {!notif.read && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRead(notif.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {t.actions.markRead}
              </Button>
            )}
            {notif.cta && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ctaRoute && navigate(ctaRoute)}
              >
                {notif.cta}
                <ChevronRight className="w-3.5 h-3.5" />
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
              ctaRoute={getCtaRoute(notif)}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>
    </div>
  );
}
