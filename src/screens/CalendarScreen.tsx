import React, { useState, useMemo } from "react";
import { Calendar as CalendarIcon, MapPin, Clock, ChevronLeft, ChevronRight, Check, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Button } from "../components/lazi-ui/Button";
import { useToast } from "../components/lazi-ui/Toast";

type Slot = { date: Date; time: string; office: string };

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function fmt(d: Date) { return d.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "long" }); }

const MOCK_SLOTS_BY_DAY: Record<string, { time: string; office: string }[]> = {};
function seedSlots() {
  const today = new Date();
  for (let i = 1; i < 45; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow === 0) continue; // duminică închis
    const key = d.toDateString();
    const slots: { time: string; office: string }[] = [];
    if (dow === 6) {
      slots.push({ time: "09:00", office: "SPCLEP Mărăști" });
      slots.push({ time: "11:40", office: "SPCLEP Mărăști" });
    } else {
      slots.push({ time: "10:20", office: "SPCLEP Cluj-Napoca" });
      if (i % 2 === 0) slots.push({ time: "16:30", office: "SPCLEP Cluj-Napoca" });
    }
    MOCK_SLOTS_BY_DAY[key] = slots;
  }
}
seedSlots();

const CURRENT: Slot = {
  date: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d; })(),
  time: "10:20",
  office: "SPCLEP Cluj-Napoca",
};

export function CalendarScreen() {
  const { addLedgerEvent } = useApp();
  const { showToast } = useToast();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [current, setCurrent] = useState<Slot>(CURRENT);
  const [pickedTime, setPickedTime] = useState<string | null>(null);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const startDow = (first.getDay() + 6) % 7; // luni = 0
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let i = 1; i <= total; i++) arr.push(new Date(month.getFullYear(), month.getMonth(), i));
    return arr;
  }, [month]);

  const slotsForSelected = selected ? MOCK_SLOTS_BY_DAY[selected.toDateString()] ?? [] : [];

  function confirm() {
    if (!selected || !pickedTime) return;
    const slot = slotsForSelected.find((s) => s.time === pickedTime);
    if (!slot) return;
    const newSlot: Slot = { date: selected, time: slot.time, office: slot.office };
    setCurrent(newSlot);
    addLedgerEvent("appointment.changed", `Programare reprogramată: ${fmt(selected)} ${slot.time} @ ${slot.office}`);
    showToast("Programare actualizată", "success");
    setSelected(null); setPickedTime(null);
  }

  const today = new Date();

  return (
    <div className="py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-sm text-slate-500 mt-1">Programări propuse de stat · poți schimba oricând.</p>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 grid place-items-center">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Programare curentă · CI</div>
              <div className="text-sm font-semibold text-slate-900">{fmt(current.date)} · {current.time}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {current.office}</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const has = !!MOCK_SLOTS_BY_DAY[d.toDateString()];
              const isCurrent = sameDay(d, current.date);
              const isSelected = selected && sameDay(d, selected);
              const isToday = sameDay(d, today);
              const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button
                  key={i}
                  disabled={!has || isPast}
                  onClick={() => { setSelected(d); setPickedTime(null); }}
                  className={`aspect-square rounded-lg text-xs font-medium relative transition-colors ${
                    isSelected ? "bg-blue-600 text-white" :
                    isCurrent ? "bg-blue-100 text-blue-700 ring-1 ring-blue-400" :
                    has && !isPast ? "text-slate-800 hover:bg-slate-100" :
                    "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {d.getDate()}
                  {has && !isSelected && !isCurrent && !isPast && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                  {isToday && !isSelected && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">Sloturi pentru {fmt(selected)}</span>
            </div>
            {slotsForSelected.length === 0 ? (
              <p className="text-xs text-slate-500">Nu sunt sloturi disponibile în această zi.</p>
            ) : (
              <div className="space-y-2">
                {slotsForSelected.map((s) => (
                  <button
                    key={s.time}
                    onClick={() => setPickedTime(s.time)}
                    className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                      pickedTime === s.time ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center text-slate-600 text-xs font-bold">{s.time}</div>
                    <div className="flex-1 text-xs text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.office}</div>
                    {pickedTime === s.time && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
            <Button fullWidth disabled={!pickedTime} onClick={confirm} className="mt-3">
              <RefreshCw className="w-4 h-4" /> Reprogramează aici
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-slate-400">Date simulate · sloturi mock HUB MAI</p>
    </div>
  );
}
