import React, { useState } from "react";
import {
  Building2, Search, CheckCircle, Clock, ChevronRight,
  Activity, User, Calendar, Bell, Shield
} from "lucide-react";
import { useApp, useTranslations, useBranding } from "../context/AppContext";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import type { AppRequest } from "../types";

function ClerkRequestCard({ request, onOpen }: { request: AppRequest; onOpen: (r: AppRequest) => void }) {
  const completedSteps = request.steps.filter((s) => s.status === "completed").length;
  const totalSteps = request.steps.length;
  const t = useTranslations();

  return (
    <Card interactive onClick={() => onOpen(request)}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{request.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">{t.clerk.maskedCnp}</span>
            </div>
            {request.appointment && (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-600">{request.appointment.date} — {request.appointment.time}</span>
              </div>
            )}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{completedSteps}/{totalSteps} {t.requests.progressSteps}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}

function ClerkRequestDetail({ request, onClose }: { request: AppRequest; onClose: () => void }) {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const clerkActionItems = [
    { key: "documents_deposited", label: t.clerk.confirmDeposited, color: "bg-indigo-600", stepIndex: 5 },
    { key: "confirmed_by_clerk", label: t.clerk.statuses.confirmedByClerk, color: "bg-blue-600", stepIndex: 5 },
    { key: "in_processing", label: t.requests.clerkActions.inProcessing, color: "bg-amber-500", stepIndex: 6 },
    { key: "ready_for_pickup", label: t.requests.clerkActions.readyForPickup, color: "bg-green-600", stepIndex: 7 },
  ];

  const activeDelegation = state.citizen?.delegations.find((d) => d.status === "active");

  async function handleStatusUpdate(status: string, label: string, stepIndex?: number) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const today = new Date().toISOString().split("T")[0];
    const updatedSteps = stepIndex !== undefined
      ? request.steps.map((s, idx) => ({
          ...s,
          status: idx < stepIndex ? "completed" as const :
                  idx === stepIndex ? "active" as const :
                  "pending" as const,
          timestamp: idx <= stepIndex ? today : s.timestamp,
        }))
      : request.steps;

    addLedgerEvent("request.status_updated", `Clerk: status updated to "${label}" for request ${request.id}`);
    dispatch({
      type: "UPDATE_REQUEST",
      requestId: request.id,
      updates: {
        status: status as AppRequest["status"],
        steps: updatedSteps,
        updatedAt: today,
      },
    });

    const newNotif = {
      id: `notif-clerk-${Date.now()}`,
      source: t.clerk.institution,
      title: `${t.clerk.statusUpdateSuccess} ${label}`,
      message: `${request.title}: ${label}`,
      priority: "info" as const,
      date: new Date().toISOString().split("T")[0],
      read: false,
      relatedEntityType: "request" as const,
      relatedEntityId: request.id,
    };
    dispatch({ type: "ADD_NOTIFICATION", notification: newNotif });
    showToast(`${t.clerk.statusUpdateSuccess} ${label}. ${t.clerk.statusUpdateNotif}`, "success");
    setLoading(false);
    onClose();
  }

  async function handleSendMessage() {
    if (!message.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    addLedgerEvent("clerk.message_sent", `Message sent to citizen: "${message.slice(0, 50)}"`);
    const newNotif = {
      id: `notif-msg-${Date.now()}`,
      source: t.clerk.institution,
      title: t.clerk.citizenMessageTitle,
      message: message,
      priority: "info" as const,
      date: new Date().toISOString().split("T")[0],
      read: false,
      relatedEntityType: "request" as const,
      relatedEntityId: request.id,
    };
    dispatch({ type: "ADD_NOTIFICATION", notification: newNotif });
    showToast(t.clerk.messageSent, "success");
    setMessage("");
    setLoading(false);
  }

  const ledgerPreview = state.ledger.slice(-4).reverse();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-5"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />

        <div>
          <h2 className="text-lg font-bold text-slate-900">{request.title}</h2>
          <div className="flex items-center gap-2 mt-1 text-slate-500">
            <User className="w-4 h-4" />
            <span className="text-sm">{t.clerk.maskedCnp}</span>
          </div>
          {request.appointment && (
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">
                {request.appointment.date} — {request.appointment.time} — {request.appointment.office}
              </span>
            </div>
          )}
        </div>

        {/* Request steps */}
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-700 mb-3">{t.requests.timeline}:</p>
          <div className="space-y-2">
            {request.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                {step.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : step.status === "active" ? (
                  <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span className={`text-xs ${step.status === "active" ? "text-blue-700 font-semibold" : step.status === "completed" ? "text-slate-600" : "text-slate-400"}`}>
                  {step.title}
                </span>
                {step.timestamp && (
                  <span className="text-xs text-slate-400 ml-auto">{step.timestamp}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delegation info */}
        {activeDelegation && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-800">{t.clerk.activeDelegation}</p>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {activeDelegation.delegateName} {t.clerk.delegateAccess}
            </p>
          </div>
        )}

        {/* Clerk status actions */}
        <div>
          <p className="text-sm font-bold text-slate-800 mb-3">{t.clerk.updateStatus}:</p>
          <div className="grid grid-cols-2 gap-2">
            {clerkActionItems.map((action) => (
              <button
                key={action.key}
                onClick={() => handleStatusUpdate(action.key, action.label, action.stepIndex)}
                disabled={loading}
                className={`${action.color} text-white text-xs font-semibold py-3 px-3 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Send message */}
        <div>
          <p className="text-sm font-bold text-slate-800 mb-2">{t.clerk.sendMessage}:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.clerk.writeMessage}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!message.trim() || loading}>
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Audit preview — real ledger data */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">{t.clerk.latestActions}</p>
          <div className="bg-slate-800 rounded-xl p-3 space-y-1 font-mono">
            {ledgerPreview.length > 0 ? ledgerPreview.map((event) => (
              <p key={event.id} className="text-green-400 text-[10px] truncate">
                ✓ {event.action} — {event.actorId}
              </p>
            )) : (
              <p className="text-slate-500 text-[10px]">{t.ledger.noEvents}</p>
            )}
          </div>
        </div>

        <Button variant="ghost" fullWidth onClick={onClose}>
          {t.actions.close}
        </Button>
      </div>
    </div>
  );
}

export function ClerkScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const brand = useBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);

  const citizen = state.citizen;
  if (!citizen) return null;

  const filteredRequests = citizen.requests.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.institution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = citizen.requests.filter(r => r.status !== "completed").length;
  const completedCount = citizen.requests.filter(r => r.status === "completed").length;

  return (
    <div className="py-4 space-y-4">
      {/* Clerk header */}
      <div className="bg-slate-800 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">{brand.clerkDashboardName}</p>
            <p className="text-slate-300 text-xs">{t.clerk.institution}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
            {t.clerk.clerkActive}
          </span>
          <span className="text-slate-400 text-xs">{filteredRequests.length} {t.clerk.requestsActive}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.clerk.searchRequest}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.clerk.activeRequests, value: activeCount, color: "text-blue-600" },
          { label: t.clerk.completedRequests, value: completedCount, color: "text-green-600" },
          { label: t.clerk.totalRequests, value: citizen.requests.length, color: "text-slate-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Request list */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">{t.clerk.requestList}</p>
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <ClerkRequestCard key={req.id} request={req} onOpen={setSelectedRequest} />
          ))}
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t.clerk.noRequestsFound}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>

      {selectedRequest && (
        <ClerkRequestDetail request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
}
