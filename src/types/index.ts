export type Language = "ro" | "en" | "hu" | "de";

export type UserRole = "citizen" | "delegate" | "clerk";

export type DocumentStatus = "ok" | "attention" | "urgent" | "expired";

export type RequestStatus =
  | "received"
  | "eligibility_checked"
  | "documents_ready"
  | "payment_verified"
  | "appointment_selected"
  | "submitted"
  | "documents_deposited"
  | "confirmed_by_clerk"
  | "in_processing"
  | "ready_for_pickup"
  | "completed";

export type NotificationPreference = "phone" | "email" | "both";

export type NotificationPriority = "urgent" | "attention" | "info";

export type DelegationStatus = "active" | "revoked" | "expired";

export type SigningMethod = "roeid" | "ceiNfc";

export interface Permission {
  viewNotifications: boolean;
  trackRequests: boolean;
  createAppointments: boolean;
  uploadFiles: boolean;
  makePayments: boolean;
  viewSensitiveData: boolean;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  expiryDate: string | null;
  status: DocumentStatus;
  institution: string;
  recommendedAction: string;
  personalDataMasked: string;
  daysUntilExpiry?: number;
  icon: string;
  ownerName?: string;
  assignedPersonId?: string;
}

export interface RequestStep {
  id: string;
  title: string;
  status: "completed" | "active" | "pending";
  timestamp?: string;
}

export interface AppRequest {
  id: string;
  title: string;
  type: string;
  status: RequestStatus;
  institution: string;
  steps: RequestStep[];
  appointment?: {
    date: string;
    time: string;
    office: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type NotificationOverrideStatus = "pending" | "accepted" | "changed" | "disputed" | "snoozed";

export interface Notification {
  id: string;
  source: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  date: string;
  read: boolean;
  relatedEntityType?: "document" | "request" | "delegation";
  relatedEntityId?: string;
  cta?: string;
  /** What the state will do automatically if the citizen does nothing. */
  proposedAction?: string;
  /** ISO date by which auto-accept will trigger. */
  autoAcceptAt?: string;
  /** Verbs the citizen can use to override. */
  verbs?: Array<"accept" | "change" | "dispute" | "snooze">;
  overrideStatus?: NotificationOverrideStatus;
  overrideNote?: string;
}

export type StandingRuleKey =
  | "auto_pay_local_taxes"
  | "auto_renew_documents"
  | "auto_accept_appointments"
  | "auto_sign_declarations"
  | "auto_accept_deliveries";

export interface StandingRule {
  key: StandingRuleKey;
  enabled: boolean;
  cap?: number;
  note?: string;
}

export interface Delegation {
  id: string;
  citizenId: string;
  delegateName: string;
  domain: string;
  permissions: Permission;
  validFrom: string;
  validUntil: string;
  status: DelegationStatus;
  signingMethod: SigningMethod;
  createdAt: string;
  monitoringOnly?: boolean;
  procuraUploaded?: boolean;
  cnp?: string;
}

export interface Citizen {
  id: string;
  fullName: string;
  cnpMasked: string;
  city: string;
  address: string;
  loginMethod: "roeid" | "ceiNfc";
  documents: Document[];
  requests: AppRequest[];
  delegations: Delegation[];
  notifications: Notification[];
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  city: string;
  services: string[];
}

export interface LedgerEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  payloadSummary: string;
  previousHash: string;
  currentHash: string;
}

export interface CEIEligibilityScenario {
  id: string;
  label: string;
  ageGroup: string;
  currentDocumentType: string;
  requestedDocumentType: string;
  caseType: string;
  cost: number | null;
  isFree: boolean;
  resultMessage: string;
  reason: string;
}

export interface AppState {
  isAuthenticated: boolean;
  currentRole: UserRole;
  language: Language;
  citizen: Citizen | null;
  ledger: LedgerEvent[];
  highContrast: boolean;
  largeText: boolean;
  loginMethod: "roeid" | "ceiNfc" | null;
  notificationPreference: NotificationPreference;
  standingRules: StandingRule[];
}
