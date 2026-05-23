import React, { useState } from "react";
import {
  CheckCircle, Clock, ChevronRight, Building2,
  Calendar, Activity
} from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Badge } from "../components/lazi-ui/Badge";
import { Button } from "../components/lazi-ui/Button";
import { useToast } from "../components/lazi-ui/Toast";
import type { AppRequest, RequestStep } from "../types";

function StepIndicator({ step, isLast }: { step: RequestStep; isLast: boolean }) {
  const t = useTranslations();
  const translatedTitle = (t.requests.stepLabels as Record<string, string>)[step.title] ?? step.title;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          step.status === "completed" ? "bg-green-500" :
          step.status === "active" ? "bg-blue-600 ring-4 ring-blue-100" :
          "bg-slate-200"
        }`}>
          {step.status === "completed" ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : step.status === "active" ? (
            <Clock className="w-4 h-4 text-white" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-8 mt-1 ${step.status === "completed" ? "bg-green-300" : "bg-slate-200"}`} />
        )}
      </div>
      <div className="flex-1 pb-8">
        <p className={`text-sm font-medium ${
          step.status === "completed" ? "text-slate-700" :
          step.status === "active" ? "text-blue-700 font-semibold" :
          "text-slate-400"
        }`}>
          {translatedTitle}
        </p>
        {step.timestamp && (
          <p className="text-xs text-slate-400 mt-0.5">{step.timestamp}</p>
        )}
        {step.status === "active" && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
            {t.requests.inCours}
          </span>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, onOpen }: { request: AppRequest; onOpen: (r: AppRequest) => void }) {
  const t = useTranslations();
  const completedCount = request.steps.filter((s) => s.status === "completed").length;
  const totalCount = request.steps.length;
  const activeStep = request.steps.find((s) => s.status === "active");
  const translatedActiveTitle = activeStep
    ? ((t.requests.stepLabels as Record<string, string>)[activeStep.title] ?? activeStep.title)
    : null;

  const statusMap: Record<string, React.ReactNode> = {
    completed: <Badge variant="ok">{t.requests.statuses.completed}</Badge>,
    received: <Badge variant="pending">{t.requests.statuses.received}</Badge>,
    in_processing: <Badge variant="info">{t.requests.statuses.in_processing}</Badge>,
    appointment_selected: <Badge variant="info">{t.requests.statuses.appointment_selected}</Badge>,
    ready_for_pickup: <Badge variant="ok">{t.requests.statuses.ready_for_pickup}</Badge>,
    documents_deposited: <Badge variant="info">{t.requests.statuses.documents_deposited}</Badge>,
    confirmed_by_clerk: <Badge variant="info">{t.requests.statuses.confirmed_by_clerk}</Badge>,
    submitted: <Badge variant="info">{t.requests.statuses.submitted}</Badge>,
    eligibility_checked: <Badge variant="info">{t.requests.statuses.eligibility_checked}</Badge>,
    documents_ready: <Badge variant="info">{t.requests.statuses.documents_ready}</Badge>,
    payment_verified: <Badge variant="info">{t.requests.statuses.payment_verified}</Badge>,
  };
  const statusBadge = statusMap[request.status] ?? <Badge variant="pending">{t.requests.statuses.inProgress}</Badge>;

  return (
    <Card interactive onClick={() => onOpen(request)}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight">{request.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {statusBadge}
            </div>
            <p className="text-xs text-slate-500 mt-1">{request.institution}</p>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">
                  {completedCount}/{totalCount} {t.requests.progressSteps}
                </span>
                {translatedActiveTitle && (
                  <span className="text-xs text-blue-600 font-medium">
                    → {translatedActiveTitle}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function RequestDetail({ request, onClose }: { request: AppRequest; onClose: () => void }) {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();
  const isClerk = state.currentRole === "clerk";
  const [loading, setLoading] = useState(false);

  const clerkStatuses = [
    { key: "dataVerified", label: t.requests.clerkActions.dataVerified },
    { key: "appointmentConfirmed", label: t.requests.clerkActions.appointmentConfirmed },
    { key: "inProcessing", label: t.requests.clerkActions.inProcessing },
    { key: "readyForPickup", label: t.requests.clerkActions.readyForPickup },
  ];

  async function handleClerkUpdate(newStatus: string, label: string) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    addLedgerEvent("request.status_updated", `Status updated: ${label} for request ${request.id}`);
    dispatch({
      type: "UPDATE_REQUEST",
      requestId: request.id,
      updates: { status: newStatus as AppRequest["status"] },
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
    showToast(`${t.clerk.statusUpdateSuccess} ${label}`, "success");
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg mx-auto p-6 space-y-5"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />

        <div>
          <h2 className="text-lg font-bold text-slate-900">{request.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-500">{request.institution}</p>
          </div>
          {request.appointment && (
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-blue-700 font-medium">
                {request.appointment.date} la {request.appointment.time} — {request.appointment.office}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="pt-2">
          {request.steps.map((step, idx) => (
            <StepIndicator
              key={step.id}
              step={step}
              isLast={idx === request.steps.length - 1}
            />
          ))}
        </div>

        {/* Clerk actions */}
        {isClerk && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-sm font-bold text-slate-800 mb-3">{t.requests.updateStatus}:</p>
            <div className="grid grid-cols-2 gap-2">
              {clerkStatuses.map(({ key, label }) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleClerkUpdate(key, label)}
                  loading={loading}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Button variant="ghost" fullWidth onClick={onClose}>
          {t.actions.close}
        </Button>
      </div>
    </div>
  );
}

export function RequestsScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const [selectedRequest, setSelectedRequest] = useState<AppRequest | null>(null);

  const citizen = state.citizen;
  if (!citizen) return null;

  const isDelegate = state.currentRole === "delegate";
  const activeDelegation = citizen.delegations.find((d) => d.status === "active");

  const requests = isDelegate && activeDelegation && activeDelegation.permissions.trackRequests
    ? citizen.requests.filter((r) => activeDelegation.domain === "all" || r.type === "identity_renewal")
    : isDelegate
    ? []
    : citizen.requests;

  return (
    <div className="py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.requests.title}</h1>
        {isDelegate && (
          <p className="text-sm text-amber-600 mt-1 font-medium">
            {t.requests.delegateLimitedView}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <RequestCard key={req.id} request={req} onOpen={setSelectedRequest} />
        ))}
      </div>

      {isDelegate && citizen.requests.length > requests.length && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-600">{t.delegations.noAccess}</p>
          <p className="text-xs text-slate-500 mt-1">
            {citizen.requests.length - requests.length} {t.requests.restrictedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">{t.delegations.noAccessNote}</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>

      {selectedRequest && (
        <RequestDetail request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}
    </div>
  );
}
