import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ChevronRight,
  FileText, CreditCard, Activity, Car, Users, Shield
} from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Badge } from "../components/lazi-ui/Badge";
import { Button } from "../components/lazi-ui/Button";

interface TimelineEvent {
  label: string;
  date: string;
  type: "urgent" | "attention" | "ok" | "info";
}

export function DashboardScreen() {
  const { state } = useApp();
  const t = useTranslations();
  const navigate = useNavigate();
  const citizen = state.citizen;

  if (!citizen) return null;

  const firstName = citizen.fullName.split(" ").pop() ?? citizen.fullName;
  const okCount = citizen.documents.filter((d) => d.status === "ok").length;

  const timelineEvents: TimelineEvent[] = [
    { label: t.dashboard.ciExpiryCard, date: t.dashboard.today, type: "info" },
    { label: t.dashboard.taxDueCard, date: "12", type: "urgent" },
    { label: t.dashboard.ciExpiryCard, date: "74", type: "attention" },
    { label: t.dashboard.licenseCard, date: "8", type: "ok" },
  ];

  const typeColors = {
    urgent: "bg-red-500",
    attention: "bg-amber-400",
    ok: "bg-green-500",
    info: "bg-blue-500",
  };

  const isDelegate = state.currentRole === "delegate";

  return (
    <div className="py-4 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t.dashboard.greeting} {firstName}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {t.dashboard.statusSummary} <span className="text-green-600 font-semibold">{okCount}</span>{" "}
              {t.dashboard.statusSuffix}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t.dashboard.trustBadge}
          </span>
          {isDelegate && (
            <Badge variant="attention">{t.common.roles.delegate}</Badge>
          )}
        </div>
      </div>

      {/* Delegate mode banner */}
      {isDelegate && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">{t.dashboard.delegateModeBanner}</p>
          <p className="text-xs text-amber-700 mt-1">{t.dashboard.delegateModeNote}</p>
        </div>
      )}

      {/* Main cards */}
      <div className="space-y-3">
        {/* Priority card: CI expiry — visible to both citizen and delegate (document domain) */}
        <Card
          interactive
          onClick={() => isDelegate ? navigate("/documents") : navigate("/id-renewal")}
          className="border-l-4 border-l-amber-400"
        >
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="attention">{t.statuses.attention}</Badge>
                </div>
                <p className="font-semibold text-slate-900 text-sm">
                  {t.dashboard.ciExpiryCard}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {t.dashboard.ciExpirySubtitle}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>
            {!isDelegate && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); navigate("/id-renewal"); }}
                >
                  {t.actions.prepareRenewal}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Locked card for delegate (health data) */}
        {isDelegate && (
          <Card className="border-l-4 border-l-slate-300 opacity-75">
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <Badge variant="locked">{t.statuses.locked}</Badge>
                  <p className="text-slate-400 text-sm mt-1 font-medium">{t.delegations.noAccess}</p>
                  <p className="text-slate-400 text-xs">{t.delegations.noAccessNote}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tax card — hidden for delegates (not in their domain) */}
        {!isDelegate && (
          <Card
            interactive
            onClick={() => navigate("/requests")}
            className="border-l-4 border-l-red-400"
          >
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="urgent">{t.statuses.urgent}</Badge>
                  <p className="font-semibold text-slate-900 text-sm mt-1">
                    {t.dashboard.taxDueCard}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{t.dashboard.taxDueInstitution}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request status card — visible to delegates with trackRequests */}
        <Card
          interactive
          onClick={() => navigate("/requests")}
          className="border-l-4 border-l-blue-400"
        >
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="info">{t.statuses.inProgress}</Badge>
                <p className="font-semibold text-slate-900 text-sm mt-1">
                  {t.dashboard.ceiRequestCard}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {t.dashboard.ceiRequestUpdate}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Driving license card — hidden for delegates */}
        {!isDelegate && (
          <Card
            interactive
            onClick={() => navigate("/documents")}
            className="border-l-4 border-l-green-400"
          >
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="ok">{t.statuses.ok}</Badge>
                  <p className="font-semibold text-slate-900 text-sm mt-1">
                    {t.dashboard.licenseCard}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{t.dashboard.licenseSubtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active delegation card — citizen only */}
        {!isDelegate && (
          <Card
            interactive
            onClick={() => navigate("/delegations")}
            className="border-l-4 border-l-purple-400"
          >
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="info">{t.dashboard.activeDelegationCard}</Badge>
                  <p className="font-semibold text-slate-900 text-sm mt-1">
                    {t.dashboard.activeDelegationCard}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {citizen.delegations.find(d => d.status === "active")?.delegateName ?? ""}{" "}
                    {t.dashboard.activeDelegationNote}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">
          {t.dashboard.upcomingEvents}
        </h2>
        <Card>
          <CardContent className="py-3">
            <div className="space-y-3">
              {timelineEvents
                .filter((e) => !isDelegate || e.type === "info" || e.type === "attention")
                .map((event, idx, arr) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${typeColors[event.type]} flex-shrink-0`} />
                    {idx < arr.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-100 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-1 min-w-0 pb-3">
                    <span className="text-sm text-slate-700 truncate">{event.label}</span>
                    <span className={`text-xs font-medium ml-2 flex-shrink-0 ${
                      event.type === "urgent" ? "text-red-600" :
                      event.type === "attention" ? "text-amber-600" :
                      event.type === "ok" ? "text-green-600" : "text-blue-600"
                    }`}>
                      {event.date === t.dashboard.today ? event.date : `${event.date} ${t.common.days}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions — citizen only */}
      {!isDelegate && (
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-3">{t.dashboard.quickActions}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/id-renewal")}
              className="bg-blue-600 text-white rounded-2xl p-4 text-left hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <FileText className="w-5 h-5 mb-2" />
              <p className="text-sm font-semibold leading-tight">{t.dashboard.prepareRenewalCI}</p>
            </button>
            <button
              onClick={() => navigate("/delegations")}
              className="bg-purple-600 text-white rounded-2xl p-4 text-left hover:bg-purple-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <Users className="w-5 h-5 mb-2" />
              <p className="text-sm font-semibold leading-tight">{t.actions.createDelegation}</p>
            </button>
          </div>
        </div>
      )}

      {/* Simulated data note */}
      <div className="text-center pb-2">
        <span className="text-xs text-slate-400">{t.common.simulatedData}</span>
      </div>
    </div>
  );
}
