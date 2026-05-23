import type { LedgerEvent, UserRole } from "../types";

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `sha256-sim:${hex}${hex}${hex}${hex}`;
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `evt-${crypto.randomUUID()}`;
    }
  } catch {
    // fallthrough
  }
  // Fallback: timestamp + random suffix (collision-resistant enough for demo)
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLedgerEvent(
  actorId: string,
  actorRole: UserRole,
  action: string,
  payloadSummary: string,
  previousHash: string
): LedgerEvent {
  const id = newId();
  const timestamp = new Date().toISOString();
  const currentHash = simpleHash(
    `${id}|${timestamp}|${actorId}|${actorRole}|${action}|${payloadSummary}|${previousHash}`
  );

  return {
    id,
    timestamp,
    actorId,
    actorRole,
    action,
    payloadSummary,
    previousHash,
    currentHash,
  };
}

export function getLastHash(ledger: LedgerEvent[]): string {
  if (ledger.length === 0) return "genesis-0000000000000000";
  return ledger[ledger.length - 1].currentHash;
}
