import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import type { AppState, Language, UserRole, LedgerEvent, Notification, AppRequest, NotificationPreference, Document, StandingRule, StandingRuleKey, NotificationOverrideStatus } from "../types";
import { mockCitizen } from "../data/mockData";
import { createLedgerEvent, getLastHash } from "../utils/ledger";
import { translations } from "../i18n";
import { branding } from "../branding";

type Action =
  | { type: "LOGIN"; method: "roeid" | "ceiNfc" }
  | { type: "LOGOUT" }
  | { type: "SET_ROLE"; role: UserRole }
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "ADD_LEDGER_EVENT"; event: LedgerEvent }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "ADD_NOTIFICATION"; notification: Notification }
  | { type: "UPDATE_REQUEST"; requestId: string; updates: Partial<AppRequest> }
  | { type: "ADD_REQUEST"; request: AppRequest }
  | { type: "TOGGLE_HIGH_CONTRAST" }
  | { type: "TOGGLE_LARGE_TEXT" }
  | { type: "CREATE_DELEGATION"; delegation: import("../types").Delegation }
  | { type: "REVOKE_DELEGATION"; delegationId: string }
  | { type: "ADD_DOCUMENT"; document: Document }
  | { type: "REMOVE_DOCUMENT"; documentId: string }
  | { type: "SET_NOTIFICATION_PREFERENCE"; preference: NotificationPreference }
  | { type: "SET_STANDING_RULE"; key: StandingRuleKey; enabled: boolean; cap?: number }
  | { type: "APPLY_NOTIFICATION_OVERRIDE"; id: string; status: NotificationOverrideStatus; note?: string };

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

const defaultStandingRules: StandingRule[] = [
  { key: "auto_pay_local_taxes", enabled: true, cap: 500, note: "Plată automată taxe locale ≤ plafon" },
  { key: "auto_renew_documents", enabled: true, note: "Statul inițiază reînnoirea CI/permis/pașaport" },
  { key: "auto_accept_appointments", enabled: true, note: "Acceptă programarea propusă de stat" },
  { key: "auto_sign_declarations", enabled: false, note: "Semnează declarații pre-completate ANAF" },
  { key: "auto_accept_deliveries", enabled: true, note: "Acceptă livrarea CEI la adresă" },
];

const initialState: AppState = {
  isAuthenticated: false,
  currentRole: "citizen",
  language: loadFromStorage<Language>("lazi_language", "ro"),
  citizen: null,
  ledger: loadFromStorage<LedgerEvent[]>("lazi_ledger", []),
  highContrast: loadFromStorage<boolean>("lazi_hc", false),
  largeText: loadFromStorage<boolean>("lazi_lt", false),
  loginMethod: null,
  notificationPreference: loadFromStorage<NotificationPreference>("lazi_notif_pref", "both"),
  standingRules: loadFromStorage<StandingRule[]>("lazi_rules", defaultStandingRules),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        loginMethod: action.method,
        citizen: {
          ...mockCitizen,
          loginMethod: action.method,
        },
        currentRole: "citizen",
      };
    case "LOGOUT":
      return {
        ...initialState,
        language: state.language,
        ledger: state.ledger,
        highContrast: state.highContrast,
        largeText: state.largeText,
      };
    case "SET_ROLE":
      return { ...state, currentRole: action.role };
    case "SET_LANGUAGE":
      return { ...state, language: action.language };
    case "ADD_LEDGER_EVENT":
      return { ...state, ledger: [...state.ledger, action.event] };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              notifications: state.citizen.notifications.map((n) =>
                n.id === action.id ? { ...n, read: true } : n
              ),
            }
          : state.citizen,
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              notifications: state.citizen.notifications.map((n) => ({ ...n, read: true })),
            }
          : state.citizen,
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              notifications: [action.notification, ...state.citizen.notifications],
            }
          : state.citizen,
      };
    case "UPDATE_REQUEST":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              requests: state.citizen.requests.map((r) =>
                r.id === action.requestId ? { ...r, ...action.updates } : r
              ),
            }
          : state.citizen,
      };
    case "ADD_REQUEST":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              requests: [...state.citizen.requests, action.request],
            }
          : state.citizen,
      };
    case "TOGGLE_HIGH_CONTRAST":
      return { ...state, highContrast: !state.highContrast };
    case "TOGGLE_LARGE_TEXT":
      return { ...state, largeText: !state.largeText };
    case "CREATE_DELEGATION":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              delegations: [...state.citizen.delegations, action.delegation],
            }
          : state.citizen,
      };
    case "REVOKE_DELEGATION":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              delegations: state.citizen.delegations.map((d) =>
                d.id === action.delegationId ? { ...d, status: "revoked" as const } : d
              ),
            }
          : state.citizen,
      };
    case "ADD_DOCUMENT":
      return {
        ...state,
        citizen: state.citizen
          ? { ...state.citizen, documents: [...state.citizen.documents, action.document] }
          : state.citizen,
      };
    case "REMOVE_DOCUMENT":
      return {
        ...state,
        citizen: state.citizen
          ? { ...state.citizen, documents: state.citizen.documents.filter((d) => d.id !== action.documentId) }
          : state.citizen,
      };
    case "SET_NOTIFICATION_PREFERENCE":
      return { ...state, notificationPreference: action.preference };
    case "SET_STANDING_RULE": {
      const exists = state.standingRules.some((r) => r.key === action.key);
      const rules = exists
        ? state.standingRules.map((r) => (r.key === action.key ? { ...r, enabled: action.enabled, cap: action.cap ?? r.cap } : r))
        : [...state.standingRules, { key: action.key, enabled: action.enabled, cap: action.cap }];
      return { ...state, standingRules: rules };
    }
    case "APPLY_NOTIFICATION_OVERRIDE":
      return {
        ...state,
        citizen: state.citizen
          ? {
              ...state.citizen,
              notifications: state.citizen.notifications.map((n) =>
                n.id === action.id ? { ...n, overrideStatus: action.status, overrideNote: action.note, read: true } : n
              ),
            }
          : state.citizen,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addLedgerEvent: (action: string, payload: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    localStorage.setItem("lazi_language", JSON.stringify(state.language));
  }, [state.language]);

  useEffect(() => {
    localStorage.setItem("lazi_ledger", JSON.stringify(state.ledger));
  }, [state.ledger]);

  useEffect(() => {
    localStorage.setItem("lazi_hc", JSON.stringify(state.highContrast));
  }, [state.highContrast]);

  useEffect(() => {
    localStorage.setItem("lazi_lt", JSON.stringify(state.largeText));
  }, [state.largeText]);

  useEffect(() => {
    localStorage.setItem("lazi_notif_pref", JSON.stringify(state.notificationPreference));
  }, [state.notificationPreference]);

  useEffect(() => {
    localStorage.setItem("lazi_rules", JSON.stringify(state.standingRules));
  }, [state.standingRules]);

  const addLedgerEvent = useCallback(
    (action: string, payload: string) => {
      const actorId = state.citizen?.id ?? "anonymous";
      const actorRole = state.currentRole;
      const previousHash = getLastHash(state.ledger);
      const event = createLedgerEvent(actorId, actorRole, action, payload, previousHash);
      dispatch({ type: "ADD_LEDGER_EVENT", event });
    },
    [state.citizen?.id, state.currentRole, state.ledger]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, addLedgerEvent }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useTranslations() {
  const { state } = useApp();
  return translations[state.language];
}

export function useBranding() {
  const { state } = useApp();
  return branding[state.language];
}
