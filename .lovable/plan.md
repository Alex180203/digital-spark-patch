# LaZi "Lazy-by-default" — with Notify & Override

Core inversion stays: **the state acts, the citizen confirms or overrides**. On top of that, every state-side action is announced via a notification, and every notification carries a one-tap override path so the citizen is never locked into the state's choice.

## 1. Notification contract (every state action follows it)

Each push / in-app card has four fixed parts:

1. **What happened** — "ANAF auto-paid your 2026 property tax: 412 RON."
2. **Why** — "Standing rule: auto-pay taxes under 500 RON from wallet."
3. **When you can still act** — "Undo window: 7 days."
4. **Actions** — `Looks good` · `Change` · `Dispute` · `Snooze`

Severity tiers drive delivery:
- `info` (already done, low-stakes) → in-app only, weekly digest
- `action_proposed` (state proposed something, needs your nod or change) → push + in-app, 72h to respond, default = accept
- `action_required` (state cannot proceed without you) → push + SMS + in-app, no auto-accept
- `dispute_window` (state acted, you can still reverse) → push + in-app, countdown visible

## 2. Worked example — appointment override

State proposes a slot via HUB MAI for CI renewal.

```text
Notification: "Appointment proposed
 SPCLEP Cluj-Napoca · Mon 14 Apr, 10:20
 Why: your CI expires 12 Jun, this is the earliest slot near your address.
 Respond by Fri or it auto-confirms.
 [ Accept ]  [ Reschedule ]  [ Delegate ]  [ Snooze 7d ]"
```

Tapping **Reschedule** opens a lightweight picker:
- Calendar of all state-side open slots (next 60 days, filterable by office, day of week, time window)
- "Find me a Saturday slot" / "Only after 16:00" quick filters
- Optional reason dropdown (work, childcare, travel, medical) — used only to improve future proposals, never blocks the change
- Confirm → state-side booking is swapped atomically, ledger records both the original and the new slot

If the citizen does nothing: slot auto-confirms at the deadline, a new "Confirmed" notification fires with a `Change` action still available until 24h before the appointment.

## 3. Standing rules (citizen-defined, override defaults)

Settings screen "How lazy do you want to be?" with toggles per domain:

| Domain | Default | Override examples |
|---|---|---|
| Document renewal | Auto-start 90d before expiry | "Ask me first" / "Never auto-pay >200 RON" |
| Taxes | Auto-pay from wallet up to cap | Cap slider, "Always ask" |
| Appointments | Auto-accept first proposed slot | "Only Sat" / "Always ask" / "Delegate to spouse" |
| Benefits | Auto-claim if eligible | "Notify only, I'll decide" |
| Delivery | Poșta Română to home | Pickup point / office |

Rules are visible, editable, and versioned in the ledger.

## 4. Override mechanics (the "power to change")

Every state-initiated event exposes the same verbs:
- **Accept** — confirm explicitly (also stops the auto-accept timer)
- **Change** — reschedule appointment, swap office, change delivery, change payment source, change amount within a band
- **Dispute** — opens a structured complaint tied to the event (pre-filled with event ID, hash, employee, timestamp)
- **Delegate** — hand this single event to a delegate without granting a standing permission
- **Snooze** — push the deadline (bounded, e.g. max 2x 7 days)
- **Undo** — within the dispute window, reverses the state action (refund, cancel booking, re-issue)

Override is always one tap from the notification — never buried behind a flow.

## 5. Screens to add / change

1. `NotificationCenter` — unified inbox grouped by severity, with the 4-part card layout
2. `EventDetail` — full "why this happened" panel: rule that fired, data sources, employee/system actor, ledger hash, all override verbs
3. `StandingRules` — the toggle/cap settings screen above
4. `ReschedulePicker` — slot calendar reused for appointments, deliveries, pickup windows
5. `Home` — collapses to one line ("You're up to date · 2 things waiting") + the notification stack

## 6. Data model deltas (mock layer)

- `events[]` gains: `actor` (`state` | `citizen` | `delegate`), `severity`, `autoAcceptAt`, `undoUntil`, `overrideVerbs[]`, `ruleId`
- `standingRules[]`: `{ id, domain, condition, action, cap, createdAt, version }`
- `ledger[]` entries now record both `originalProposal` and `citizenOverride` when a Change/Dispute/Undo fires
- Existing 6-step guided flow stays, reachable from any event via "Do it manually" — nothing is removed

## 7. Roles

- **Citizen**: confirm / change / dispute / delegate / snooze / set rules
- **Employee**: propose actions, must attach reason + data source; sees citizen overrides in their queue
- **Delegate**: same verbs as citizen, scoped by the 6 granular permissions; standing delegate rules allowed

## 8. Out of scope for this pass

- Real integrations (still mocked: HUB MAI slots, Ghișeul.ro, ROeID, NFC)
- Server-side rule engine — rules evaluated client-side against mock events
- Real push delivery — simulated via in-app toast + notification center

## Open questions before build

1. Should auto-accept timers be **per event** (each notification has its own deadline) or **per domain** (one global window)?
2. Max snooze count — 2x 7 days, or configurable per domain?
3. Should `Dispute` open a free-text form, or a structured "what's wrong" picker (wrong office / wrong amount / wrong person / other)?
4. Do delegates get their own notification stream, or do they see the citizen's stream filtered to their permissions?
