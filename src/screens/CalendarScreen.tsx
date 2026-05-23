import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight,
  FileText, Bell, ClipboardList, AlertTriangle, Clock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";

type EventKind = "expiry" | "appointment" | "deadline" | "payment";

type CalEvent = {
  id: string;
  date: Date;
  title: string;
  subtitle?: string;
  kind: EventKind;
  href?: string;
  time?: string;
};

const KIND_STYLES: Record<EventKind, { dot: string; chip: string; icon: React.ReactNode; label: string }> = {
  expiry: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 border-red-200",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Expirare",
  },
  appointment: {
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <MapPin className="w-3.5 h-3.5" />,
    label: "Programare",
  },
  deadline: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Bell className="w-3.5 h-3.5" />,
    label: "Termen",
  },
  payment: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    label: "Plată",
  },
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function fmt(d: Date) { return d.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "long" }); }

export function CalendarScreen() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(new Date());
  const [filters, setFilters] = useState<Record<EventKind, boolean>>({
    expiry: true, appointment: true, deadline: true, payment: true,
  });

  const events = useMemo<CalEvent[]>(() => {
    const c = state.citizen;
    if (!c) return [];
    const list: CalEvent[] = [];

    // Document expiries
    for (const doc of c.documents) {
      if (!doc.expiryDate) continue;
      list.push({
        id: `exp-${doc.id}`,
        date: new Date(doc.expiryDate),
        title: `Expiră: ${doc.name}`,
        subtitle: doc.institution + (doc.ownerName ? ` · ${doc.ownerName}` : ""),
        kind: "expiry",
        href: "/documents",
      });
    }

    // Request appointments
    for (const r of c.requests) {
      if (r.appointment) {
        list.push({
          id: `app-${r.id}`,
          date: new Date(r.appointment.date),
          title: r.title,
          subtitle: r.appointment.office,
          time: r.appointment.time,
          kind: "appointment",
          href: "/requests",
        });
      }
    }

    // Notification deadlines (auto-accept dates)
    for (const n of c.notifications) {
      if (!n.autoAcceptAt || n.overrideStatus && n.overrideStatus !== "pending") continue;
      const isPayment = /plat|tax|ron/i.test(n.message + n.title);
      list.push({
        id: `not-${n.id}`,
        date: new Date(n.autoAcceptAt),
        title: n.title,
        subtitle: n.proposedAction ?? n.source,
        kind: isPayment ? "payment" : "deadline",
        href: "/notifications",
      });
    }

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [state.citizen]);

  const filtered = events.filter((e) => filters[e.kind]);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const startDow = (first.getDay() + 6) % 7;
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(new Date(month.getFullYear(), month.getMonth(), i));
    return arr;
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of filtered) {
      const k = e.date.toDateString();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [filtered]);

  const today = new Date();
  const selectedEvents = eventsByDay.get(selected.toDateString()) ?? [];

  const upcoming = filtered
    .filter((e) => e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .slice(0, 8);

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Toate termenele tale cu statul, într-un singur loc.</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_STYLES) as EventKind[]).map((k) => {
          const s = KIND_STYLES[k];
          const active = filters[k];
          return (
            <button
              key={k}
              onClick={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active ? s.chip : "bg-slate-50 text-slate-400 border-slate-200 line-through"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Month grid */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMonth(addMonths(month, -1))} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <div className="text-sm font-semibold text-slate-900 capitalize">
              {month.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setMonth(addMonths(month, 1))} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["L", "Ma", "Mi", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const dayEvents = eventsByDay.get(d.toDateString()) ?? [];
              const isSelected = sameDay(d, selected);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  className={`aspect-square rounded-lg text-xs font-medium relative transition-colors p-1 flex flex-col items-center justify-start ${
                    isSelected ? "bg-blue-600 text-white" :
                    isToday ? "bg-amber-50 text-amber-700 ring-1 ring-amber-300" :
                    "text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <span>{d.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-auto mb-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : KIND_STYLES[e.kind].dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900 capitalize">{fmt(selected)}</span>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-slate-500">Nicio activitate în această zi.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => {
                const s = KIND_STYLES[e.kind];
                return (
                  <button
                    key={e.id}
                    onClick={() => e.href && navigate(e.href)}
                    className="w-full text-left rounded-xl border border-slate-200 p-3 flex items-start gap-3 hover:border-blue-300 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg grid place-items-center border ${s.chip}`}>{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{e.title}</div>
                      {e.subtitle && <div className="text-xs text-slate-500 truncate">{e.subtitle}</div>}
                      {e.time && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {e.time}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming agenda */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">Următoarele {upcoming.length} evenimente</span>
          </div>
          <div className="space-y-2">
            {upcoming.map((e) => {
              const s = KIND_STYLES[e.kind];
              return (
                <button
                  key={e.id}
                  onClick={() => e.href && navigate(e.href)}
                  className="w-full text-left rounded-xl bg-slate-50 hover:bg-slate-100 p-3 flex items-center gap-3"
                >
                  <div className="text-center w-12 shrink-0">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      {e.date.toLocaleDateString("ro-RO", { month: "short" })}
                    </div>
                    <div className="text-lg font-bold text-slate-900 leading-none">{e.date.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="text-[10px] uppercase font-semibold text-slate-500">{s.label}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 truncate">{e.title}</div>
                    {e.subtitle && <div className="text-xs text-slate-500 truncate">{e.subtitle}</div>}
                  </div>
                </button>
              );
            })}
            {upcoming.length === 0 && (
              <p className="text-xs text-slate-500">Niciun eveniment programat.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400">Date simulate · agregat din documente, cereri și notificări</p>
    </div>
  );
}
