import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Bell, Check, Clock, Calendar, AlertTriangle, ChevronRight, ArrowLeft,
  Shield, Zap, Wallet, FileCheck, MapPin, Sparkles, Settings2, Undo2,
  MessageSquareWarning, UserCog, X, Info,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LaZiDemo });

type Severity = "info" | "action_proposed" | "action_required" | "dispute_window";

type LaziEvent = {
  id: string;
  title: string;
  actor: "state" | "citizen" | "delegate";
  agency: string;
  severity: Severity;
  why: string;
  rule?: string;
  proposedAt?: string;
  autoAcceptIn?: string;
  undoUntil?: string;
  amount?: string;
  icon: any;
  domain: "document" | "tax" | "appointment" | "benefit" | "delivery";
  detail?: string;
};

const EVENTS: LaziEvent[] = [
  {
    id: "ev-appt",
    title: "Appointment proposed: CI renewal",
    actor: "state",
    agency: "SPCLEP Cluj-Napoca",
    severity: "action_proposed",
    why: "Your CI expires 12 Jun. This is the earliest slot near your address.",
    rule: "Auto-accept first proposed slot",
    proposedAt: "Mon, 14 Apr · 10:20",
    autoAcceptIn: "Auto-confirms in 3d 14h",
    icon: Calendar,
    domain: "appointment",
    detail: "HUB MAI · slot #A-2041 · officer M. Pop",
  },
  {
    id: "ev-tax",
    title: "Property tax 2026 auto-paid",
    actor: "state",
    agency: "ANAF Cluj",
    severity: "dispute_window",
    why: "Standing rule: auto-pay taxes under 500 RON from LaZi wallet.",
    rule: "Tax auto-pay · cap 500 RON",
    amount: "412 RON",
    undoUntil: "Undo until 22 Mar (6d left)",
    icon: Wallet,
    domain: "tax",
    detail: "Ghișeul.ro · receipt #GH-2026-44218",
  },
  {
    id: "ev-benefit",
    title: "Heating subsidy ready to claim",
    actor: "state",
    agency: "DGASPC",
    severity: "action_required",
    why: "Your income bracket and address qualify. State cannot file without your nod.",
    proposedAt: "Estimated 340 RON / month",
    icon: Sparkles,
    domain: "benefit",
    detail: "Auto-fills form 14B from data.gov.ro",
  },
  {
    id: "ev-passport",
    title: "Passport renewal started",
    actor: "state",
    agency: "Pașapoarte Cluj",
    severity: "info",
    why: "Renewal auto-started 90 days before expiry (rule: document auto-renew).",
    rule: "Document auto-renew · 90d window",
    icon: FileCheck,
    domain: "document",
    detail: "Step 2/6 · awaiting biometrics slot",
  },
];

const RULES = [
  { id: "r1", domain: "Document renewal", icon: FileCheck, on: true, label: "Auto-start 90 days before expiry" },
  { id: "r2", domain: "Tax payments", icon: Wallet, on: true, label: "Auto-pay from wallet up to 500 RON" },
  { id: "r3", domain: "Appointments", icon: Calendar, on: true, label: "Auto-accept first proposed slot" },
  { id: "r4", domain: "Benefits", icon: Sparkles, on: false, label: "Auto-claim if I qualify (currently: notify only)" },
  { id: "r5", domain: "Delivery", icon: MapPin, on: true, label: "Poșta Română to home address" },
];

const SLOTS = [
  { date: "Sat, 12 Apr", time: "09:00", office: "SPCLEP Mărăști" },
  { date: "Sat, 12 Apr", time: "11:40", office: "SPCLEP Mărăști" },
  { date: "Mon, 14 Apr", time: "10:20", office: "SPCLEP Cluj-Napoca", current: true },
  { date: "Wed, 16 Apr", time: "16:30", office: "SPCLEP Cluj-Napoca" },
  { date: "Sat, 19 Apr", time: "08:40", office: "SPCLEP Florești" },
  { date: "Sat, 19 Apr", time: "13:10", office: "SPCLEP Florești" },
];

const SEV_STYLES: Record<Severity, { dot: string; chip: string; label: string }> = {
  info: { dot: "bg-muted-foreground/40", chip: "bg-muted text-muted-foreground", label: "Info" },
  action_proposed: { dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400", label: "Proposed" },
  action_required: { dot: "bg-rose-500", chip: "bg-rose-500/15 text-rose-700 dark:text-rose-400", label: "Action required" },
  dispute_window: { dot: "bg-sky-500", chip: "bg-sky-500/15 text-sky-700 dark:text-sky-400", label: "Done · can undo" },
};

type Tab = "home" | "rules" | "ledger";

function LaZiDemo() {
  const [tab, setTab] = useState<Tab>("home");
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [reschedule, setReschedule] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<number | null>(null);
  const [eventState, setEventState] = useState<Record<string, "pending" | "accepted" | "changed" | "disputed" | "undone">>({});
  const [rules, setRules] = useState(RULES);
  const [ledger, setLedger] = useState<{ ts: string; actor: string; action: string; hash: string }[]>([
    { ts: "today 09:14", actor: "state · ANAF", action: "Auto-paid property tax 412 RON", hash: "0xa41f…22b" },
    { ts: "today 09:14", actor: "state · Pașapoarte", action: "Started passport renewal (rule fired 90d)", hash: "0x9c08…f17" },
    { ts: "yest 18:02", actor: "state · SPCLEP", action: "Proposed CI slot Mon 14 Apr 10:20", hash: "0x71de…003" },
  ]);

  const event = useMemo(() => EVENTS.find((e) => e.id === openEvent) || null, [openEvent]);

  const pushLedger = (action: string, actor = "citizen · you") => {
    const hash = "0x" + Math.random().toString(16).slice(2, 6) + "…" + Math.random().toString(16).slice(2, 5);
    setLedger((l) => [{ ts: "just now", actor, action, hash }, ...l]);
  };

  const act = (id: string, kind: "accepted" | "changed" | "disputed" | "undone", note: string) => {
    setEventState((s) => ({ ...s, [id]: kind }));
    pushLedger(note);
  };

  const waiting = EVENTS.filter((e) => !eventState[e.id] && e.severity !== "info").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col" style={{ height: "min(90vh, 780px)" }}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">Bună, Andrei</div>
              <div className="text-2xl font-bold tracking-tight">LaZi</div>
            </div>
            <div className="size-10 rounded-full bg-primary-foreground/15 grid place-items-center">
              <Shield className="size-5" />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-primary-foreground/10 backdrop-blur p-3 flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary-foreground/20 grid place-items-center">
              <Zap className="size-4" />
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium">You're up to date</div>
              <div className="opacity-80 text-xs">{waiting} thing{waiting === 1 ? "" : "s"} waiting · the state did the rest</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-2 bg-card">
          {([
            { id: "home", label: "Inbox", icon: Bell },
            { id: "rules", label: "Lazy rules", icon: Settings2 },
            { id: "ledger", label: "Ledger", icon: FileCheck },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setOpenEvent(null); setReschedule(false); }}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Event detail / reschedule overlays */}
          {event && !reschedule && (
            <EventDetailView
              event={event}
              status={eventState[event.id]}
              onBack={() => setOpenEvent(null)}
              onAccept={() => { act(event.id, "accepted", `Accepted: ${event.title}`); setOpenEvent(null); }}
              onReschedule={() => setReschedule(true)}
              onDispute={() => { act(event.id, "disputed", `Disputed: ${event.title}`); setOpenEvent(null); }}
              onUndo={() => { act(event.id, "undone", `Undone: ${event.title} (refund queued)`); setOpenEvent(null); }}
            />
          )}

          {event && reschedule && (
            <ReschedulePicker
              event={event}
              picked={pickedSlot}
              onPick={setPickedSlot}
              onBack={() => { setReschedule(false); setPickedSlot(null); }}
              onConfirm={() => {
                if (pickedSlot === null) return;
                const s = SLOTS[pickedSlot];
                act(event.id, "changed", `Rescheduled ${event.title} → ${s.date} ${s.time} @ ${s.office}`);
                setReschedule(false); setPickedSlot(null); setOpenEvent(null);
              }}
            />
          )}

          {!event && tab === "home" && (
            <InboxView events={EVENTS} eventState={eventState} onOpen={setOpenEvent} />
          )}
          {!event && tab === "rules" && (
            <RulesView rules={rules} onToggle={(id) => {
              setRules((rs) => rs.map((r) => r.id === id ? { ...r, on: !r.on } : r));
              const r = rules.find((x) => x.id === id);
              if (r) pushLedger(`Rule "${r.domain}" → ${!r.on ? "ON" : "OFF"}`);
            }} />
          )}
          {!event && tab === "ledger" && <LedgerView entries={ledger} />}
        </div>
      </div>
    </div>
  );
}

function InboxView({ events, eventState, onOpen }: {
  events: LaziEvent[];
  eventState: Record<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        The state did things for you
      </div>
      {events.map((e) => {
        const sev = SEV_STYLES[e.severity];
        const status = eventState[e.id];
        const Icon = e.icon;
        return (
          <button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="w-full text-left bg-background border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${sev.chip}`}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.chip}`}>{sev.label}</span>
                  <span className="text-[10px] text-muted-foreground">{e.agency}</span>
                </div>
                <div className="font-semibold text-sm leading-snug">{e.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.why}</div>
                {(e.autoAcceptIn || e.undoUntil) && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {e.autoAcceptIn || e.undoUntil}
                  </div>
                )}
                {status && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <Check className="size-3" /> {status === "changed" ? "Rescheduled" : status[0].toUpperCase() + status.slice(1)}
                  </div>
                )}
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function EventDetailView({ event, status, onBack, onAccept, onReschedule, onDispute, onUndo }: {
  event: LaziEvent; status?: string;
  onBack: () => void; onAccept: () => void; onReschedule: () => void; onDispute: () => void; onUndo: () => void;
}) {
  const sev = SEV_STYLES[event.severity];
  const Icon = event.icon;
  const canReschedule = event.domain === "appointment" || event.domain === "delivery";
  const canUndo = event.severity === "dispute_window";

  return (
    <div className="p-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className={`size-12 rounded-xl grid place-items-center ${sev.chip}`}><Icon className="size-6" /></div>
        <div className="flex-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sev.chip}`}>{sev.label}</span>
          <h2 className="font-bold text-base mt-1 leading-tight">{event.title}</h2>
          <div className="text-xs text-muted-foreground mt-0.5">{event.agency}</div>
        </div>
      </div>

      {event.proposedAt && (
        <div className="bg-muted rounded-xl p-3 mb-3 flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{event.proposedAt}</span>
        </div>
      )}
      {event.amount && (
        <div className="bg-muted rounded-xl p-3 mb-3 flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{event.amount}</span>
        </div>
      )}

      <div className="space-y-3 mb-5">
        <Row icon={Info} title="Why this happened" body={event.why} />
        {event.rule && <Row icon={Settings2} title="Rule that fired" body={event.rule} />}
        {event.detail && <Row icon={FileCheck} title="Source" body={event.detail} />}
        {(event.autoAcceptIn || event.undoUntil) && (
          <Row icon={Clock} title="Window" body={event.autoAcceptIn || event.undoUntil!} />
        )}
      </div>

      {status ? (
        <div className="rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 text-sm flex items-center gap-2">
          <Check className="size-4" /> Recorded in ledger as <b>{status}</b>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {canUndo ? (
            <button onClick={onUndo} className="col-span-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90">
              <Undo2 className="size-4" /> Undo this action
            </button>
          ) : (
            <button onClick={onAccept} className="rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90">
              <Check className="size-4" /> Accept
            </button>
          )}
          {canReschedule && (
            <button onClick={onReschedule} className="rounded-xl border border-border py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent">
              <Calendar className="size-4" /> Reschedule
            </button>
          )}
          {!canReschedule && !canUndo && (
            <button onClick={onDispute} className="rounded-xl border border-border py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent">
              <MessageSquareWarning className="size-4" /> Dispute
            </button>
          )}
          <button className="rounded-xl border border-border py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent">
            <UserCog className="size-4" /> Delegate
          </button>
          {(canReschedule || canUndo) && (
            <button onClick={onDispute} className="rounded-xl border border-border py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent">
              <MessageSquareWarning className="size-4" /> Dispute
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0"><Icon className="size-4 text-muted-foreground" /></div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-sm leading-snug">{body}</div>
      </div>
    </div>
  );
}

function ReschedulePicker({ event, picked, onPick, onBack, onConfirm }: {
  event: LaziEvent; picked: number | null;
  onPick: (i: number) => void; onBack: () => void; onConfirm: () => void;
}) {
  return (
    <div className="p-4 flex flex-col h-full">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>
      <h2 className="font-bold text-base mb-1">Pick a slot that fits you</h2>
      <p className="text-xs text-muted-foreground mb-4">
        State-side slots near you · changing here cancels the proposed one automatically.
      </p>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {["All", "Saturdays only", "After 16:00", "Closest office"].map((f, i) => (
          <button key={f} className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${i === 0 ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {SLOTS.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${
              picked === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="size-10 rounded-lg bg-muted grid place-items-center"><Calendar className="size-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-medium">{s.date} · {s.time}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {s.office}</div>
            </div>
            {s.current && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">current</span>}
            {picked === i && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </div>

      <button
        disabled={picked === null}
        onClick={onConfirm}
        className="mt-3 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      >
        Confirm new slot
      </button>
    </div>
  );
}

function RulesView({ rules, onToggle }: { rules: typeof RULES; onToggle: (id: string) => void }) {
  return (
    <div className="p-4 space-y-3">
      <div className="rounded-xl bg-muted p-3 flex items-start gap-2">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-snug">
          The state acts on your behalf based on these rules. Turn any off to be asked first.
        </div>
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        How lazy do you want to be?
      </div>
      {rules.map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.id} className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`size-10 rounded-xl grid place-items-center ${r.on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <Icon className="size-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{r.domain}</div>
              <div className="text-xs text-muted-foreground leading-snug">{r.label}</div>
            </div>
            <button
              onClick={() => onToggle(r.id)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${r.on ? "bg-primary" : "bg-muted"}`}
              aria-label={`Toggle ${r.domain}`}
            >
              <span className={`absolute top-0.5 size-5 bg-card rounded-full shadow transition-all ${r.on ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LedgerView({ entries }: { entries: { ts: string; actor: string; action: string; hash: string }[] }) {
  return (
    <div className="p-4 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">
        Immutable ledger
      </div>
      <p className="text-xs text-muted-foreground px-1 mb-2">
        Every state-side action and citizen override is hashed and recorded. Disputes attach here.
      </p>
      {entries.map((e, i) => (
        <div key={i} className="bg-background border border-border rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-foreground">{e.actor}</span>
            <span className="text-muted-foreground">{e.ts}</span>
          </div>
          <div className="text-foreground/90 leading-snug">{e.action}</div>
          <div className="font-mono text-[10px] text-muted-foreground mt-1">{e.hash}</div>
        </div>
      ))}
    </div>
  );
}
