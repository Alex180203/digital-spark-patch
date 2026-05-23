import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Car, HeartPulse, Shield, BookOpen, CreditCard,
  ChevronRight, AlertTriangle, CheckCircle, Clock, Plus, X as XIcon,
  Trash2, Eye, EyeOff, MapPin, ExternalLink,
} from "lucide-react";
import { useApp, useTranslations } from "../context/AppContext";
import { Card, CardContent } from "../components/lazi-ui/Card";
import { Button } from "../components/lazi-ui/Button";
import { useToast } from "../components/lazi-ui/Toast";
import type { Document } from "../types";

const iconMap: Record<string, React.ReactNode> = {
  IdCard: <FileText className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
};

type Translations = ReturnType<typeof useTranslations>;

function makeStatusConfig(t: Translations) {
  return {
    ok: { badge: "ok" as const, icon: <CheckCircle className="w-4 h-4 text-green-600" />, label: t.documents.statusOk, bg: "bg-green-100 text-green-700" },
    attention: { badge: "attention" as const, icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, label: t.documents.statusAttention, bg: "bg-amber-100 text-amber-700" },
    urgent: { badge: "urgent" as const, icon: <AlertTriangle className="w-4 h-4 text-red-600" />, label: t.documents.statusUrgent, bg: "bg-red-100 text-red-700" },
    expired: { badge: "urgent" as const, icon: <Clock className="w-4 h-4 text-red-600" />, label: t.documents.statusExpired, bg: "bg-red-100 text-red-700" },
  };
}

function expiryLabel(doc: Document, t: Translations): string {
  if (doc.daysUntilExpiry === undefined) return "";
  if (doc.daysUntilExpiry > 0) return `${doc.daysUntilExpiry} ${t.common.days}`;
  if (doc.daysUntilExpiry === 0) return t.documents.statusExpired;
  return `${Math.abs(doc.daysUntilExpiry)} ${t.documents.expiredAgo}`;
}

function DocumentCard({ doc, onOpen, showExpiry }: { doc: Document; onOpen: (doc: Document) => void; showExpiry: boolean }) {
  const t = useTranslations();
  const statusConfig = makeStatusConfig(t);
  const config = statusConfig[doc.status];
  const isExpired = doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry < 0;

  return (
    <Card interactive onClick={() => onOpen(doc)}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            doc.status === "ok" ? "bg-green-100 text-green-600" :
            doc.status === "attention" ? "bg-amber-100 text-amber-600" :
            "bg-red-100 text-red-600"
          }`}>
            {iconMap[doc.icon] ?? <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-slate-900 text-sm">{doc.name}</p>
            </div>
            {doc.ownerName && (
              <p className="text-xs text-purple-600 font-medium mb-1">{t.documents.ownerLabel}: {doc.ownerName}</p>
            )}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {config.icon}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg}`}>
                {config.label}
              </span>
              {showExpiry && doc.daysUntilExpiry !== undefined && (
                <span className={`text-xs font-medium ${isExpired ? "text-red-600" : "text-slate-500"}`}>
                  {isExpired ? `⚠ ${expiryLabel(doc, t)}` : expiryLabel(doc, t)}
                </span>
              )}
              {showExpiry && doc.expiryDate && (
                <span className="text-xs text-slate-400">· {doc.expiryDate}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{doc.institution}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function unmaskedData(doc: Document): string {
  // Simulated full data reveal (in a real app would require ROeID re-auth).
  if (doc.personalDataMasked.includes("***")) return doc.personalDataMasked.replace(/\*+/g, "1985-04-12");
  return `${doc.personalDataMasked} · CNP 1850412080011 · Seria KX nr. 442180`;
}

function institutionMapUrl(institution: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(institution + " Cluj-Napoca")}`;
}

function DocumentDetail({ doc, onClose, onDelete }: { doc: Document; onClose: () => void; onDelete: (d: Document) => void }) {
  const { state } = useApp();
  const t = useTranslations();
  const navigate = useNavigate();
  const statusConfig = makeStatusConfig(t);
  const config = statusConfig[doc.status];
  const isCitizen = state.currentRole === "citizen";
  const isExpired = doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry < 0;
  const showRenewAction = doc.status === "expired" || doc.status === "urgent";
  const [showFullData, setShowFullData] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-lg mx-auto p-6 space-y-5"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto lg:hidden" />

        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            doc.status === "ok" ? "bg-green-100 text-green-600" :
            doc.status === "attention" ? "bg-amber-100 text-amber-600" :
            "bg-red-100 text-red-600"
          }`}>
            {iconMap[doc.icon] ?? <FileText className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{doc.name}</h2>
            {doc.ownerName && (
              <p className="text-sm text-purple-600 font-medium">{t.documents.ownerLabel}: {doc.ownerName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {config.icon}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg}`}>{config.label}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-start gap-4">
            <span className="text-xs text-slate-500 flex-shrink-0">{t.documents.maskedData}</span>
            <div className="text-right">
              <div className="text-xs font-medium text-slate-800">
                {showFullData ? unmaskedData(doc) : doc.personalDataMasked}
              </div>
              <button
                onClick={() => setShowFullData((v) => !v)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
              >
                {showFullData ? <><EyeOff className="w-3 h-3" /> Ascunde</> : <><Eye className="w-3 h-3" /> Arată datele complete</>}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-xs text-slate-500 flex-shrink-0">{t.documents.institution}</span>
            <span className="text-xs font-medium text-right text-slate-800">{doc.institution}</span>
          </div>
          {doc.expiryDate && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-xs text-slate-500 flex-shrink-0">{t.documents.validUntil}</span>
              <span className="text-xs font-medium text-right text-slate-800">{doc.expiryDate}</span>
            </div>
          )}
          {doc.daysUntilExpiry !== undefined && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-xs text-slate-500 flex-shrink-0">{t.documents.daysLeft}</span>
              <span className={`text-xs font-medium text-right ${isExpired ? "text-red-600" : "text-slate-800"}`}>{expiryLabel(doc, t)}</span>
            </div>
          )}
        </div>

        <div className={`border rounded-xl p-3 ${isExpired ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <p className={`text-xs font-medium ${isExpired ? "text-red-700" : "text-blue-700"}`}>{t.documents.action}</p>
          <p className={`text-xs mt-1 ${isExpired ? "text-red-600" : "text-blue-600"}`}>{doc.recommendedAction}</p>
        </div>

        <a
          href={institutionMapUrl(doc.institution)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 grid place-items-center text-blue-600"><MapPin className="w-4 h-4" /></div>
            <div>
              <div className="text-sm font-medium text-slate-900">Mergi unde trebuie</div>
              <div className="text-xs text-slate-500">{doc.institution} · cea mai apropiată locație</div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </a>

        <div className="flex flex-col gap-2">
          {doc.type === "identity_card" && isCitizen && (
            <Button fullWidth onClick={() => { onClose(); navigate("/id-renewal"); }}>
              {t.documents.prepareRenewal}
            </Button>
          )}
          {showRenewAction && doc.type !== "identity_card" && (
            <Button fullWidth variant="outline" onClick={() => { onClose(); }}>
              {t.documents.renewAction}
            </Button>
          )}
          {isCitizen && (
            confirmDelete ? (
              <div className="flex gap-2">
                <Button fullWidth variant="ghost" onClick={() => setConfirmDelete(false)}>Anulează</Button>
                <button
                  onClick={() => { onDelete(doc); onClose(); }}
                  className="flex-1 rounded-xl bg-red-600 text-white text-sm font-medium py-2.5 hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Confirmă ștergerea
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium py-2.5 hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Șterge documentul
              </button>
            )
          )}
          <Button variant="ghost" fullWidth onClick={onClose}>
            {t.actions.close}
          </Button>
        </div>
      </div>
    </div>
  );
}

const DOC_TYPE_OPTIONS = [
  { key: "european_health_card", label: "Card European de Sănătate", icon: "HeartPulse", institution: "CNAS" },
  { key: "driving_license", label: "Permis de conducere", icon: "Car", institution: "DRPCIV" },
  { key: "passport", label: "Pașaport", icon: "BookOpen", institution: "MAE / Pașapoarte" },
  { key: "rovinieta", label: "Rovinietă", icon: "Car", institution: "CNAIR" },
  { key: "itp", label: "ITP", icon: "Shield", institution: "RAR" },
  { key: "health_card", label: "Card de sănătate CNAS", icon: "HeartPulse", institution: "CNAS" },
];

function AddDocumentModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();

  const [docTypeKey, setDocTypeKey] = useState("european_health_card");
  const [ownerType, setOwnerType] = useState<"self" | "other">("other");
  const [ownerName, setOwnerName] = useState("Gavan Alexandru");
  const [expiryDate, setExpiryDate] = useState("");

  function handleAdd() {
    if (state.currentRole !== "citizen") {
      showToast("Doar cetățeanul poate adăuga documente.", "error");
      return;
    }
    const typeInfo = DOC_TYPE_OPTIONS.find((d) => d.key === docTypeKey) ?? DOC_TYPE_OPTIONS[0];
    const days = expiryDate
      ? Math.floor((new Date(expiryDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
      : undefined;

    const docStatus =
      days === undefined ? "ok" :
      days < 0 ? "expired" :
      days < 30 ? "urgent" :
      days < 90 ? "attention" : "ok";

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      type: typeInfo.key,
      name: typeInfo.label,
      expiryDate: expiryDate || null,
      status: docStatus,
      institution: typeInfo.institution,
      recommendedAction:
        days !== undefined && days < 0
          ? "Document expirat. Reînnoiește urgent."
          : days !== undefined && days < 30
          ? "Expiră curând. Reînnoiește imediat."
          : "Verifică periodic.",
      personalDataMasked: "Date simulate",
      daysUntilExpiry: days,
      icon: typeInfo.icon,
      ownerName: ownerType === "other" ? ownerName : undefined,
    };

    dispatch({ type: "ADD_DOCUMENT", document: newDoc });
    addLedgerEvent("document.added", `Document adăugat: ${newDoc.name}${newDoc.ownerName ? " pentru " + newDoc.ownerName : ""}`);
    showToast(t.documents.addDocumentSuccess, "success");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl lg:rounded-3xl w-full max-w-lg mx-auto p-6 space-y-4"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t.documents.addDocumentTitle}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100">
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t.documents.documentType}</label>
          <select
            value={docTypeKey}
            onChange={(e) => setDocTypeKey(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOC_TYPE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t.documents.assignToPerson}</label>
          <div className="flex gap-2 mb-3">
            {(["self", "other"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOwnerType(type)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  ownerType === type
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {type === "self" ? t.documents.selfOwner : t.documents.otherOwner}
              </button>
            ))}
          </div>
          {ownerType === "other" && (
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t.documents.ownerNameLabel}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t.documents.expiryDateLabel}</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t.actions.cancel}
          </Button>
          <Button className="flex-1" onClick={handleAdd}>
            {t.actions.addDocument}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentsScreen() {
  const { state, dispatch, addLedgerEvent } = useApp();
  const t = useTranslations();
  const { showToast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showExpiry, setShowExpiry] = useState(false);

  const citizen = state.citizen;
  if (!citizen) return null;

  const handleDelete = (d: Document) => {
    if (state.currentRole !== "citizen") {
      showToast("Doar cetățeanul poate șterge documente.", "error");
      return;
    }
    dispatch({ type: "REMOVE_DOCUMENT", documentId: d.id });
    addLedgerEvent("document.removed", `Document șters: ${d.name}`);
    showToast(`${d.name} a fost șters`, "success");
  };

  const statusConfig = makeStatusConfig(t);
  const isDelegate = state.currentRole === "delegate";
  const isCitizen = state.currentRole === "citizen";
  const activeDelegation = citizen.delegations.find((d) => d.status === "active");

  const docs = isDelegate && activeDelegation
    ? activeDelegation.permissions.viewSensitiveData
      ? citizen.documents
      : citizen.documents.filter((d) => ["identity_card", "passport", "driving_license"].includes(d.type))
    : citizen.documents;

  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const urgentCount = docs.filter((d) => d.status === "urgent").length;
  const attentionCount = docs.filter((d) => d.status === "attention").length;

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.documents.title}</h1>
          {isDelegate && (
            <p className="text-sm text-amber-600 mt-1 font-medium">
              {t.documents.delegateLimitedView}
            </p>
          )}
        </div>
        {isCitizen && (
          <Button size="sm" onClick={() => setShowAddDoc(true)}>
            <Plus className="w-4 h-4" />
            {t.actions.addDocument}
          </Button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {expiredCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {expiredCount} {statusConfig.expired.label}
          </span>
        )}
        {urgentCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {urgentCount} {statusConfig.urgent.label}
          </span>
        )}
        {attentionCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            {attentionCount} {statusConfig.attention.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{docs.length} documente</p>
        <button
          onClick={() => setShowExpiry((v) => !v)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            showExpiry
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          {showExpiry ? "Ascunde datele de expirare" : "Arată datele de expirare"}
        </button>
      </div>

      <div className="space-y-3">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onOpen={setSelectedDoc} showExpiry={showExpiry} />
        ))}
      </div>

      {isDelegate && citizen.documents.length > docs.length && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-600">{t.delegations.noAccess}</p>
          <p className="text-xs text-slate-500 mt-1">
            {citizen.documents.length - docs.length} {t.documents.restrictedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">{t.delegations.noAccessNote}</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">{t.common.simulatedData}</p>

      {selectedDoc && (
        <DocumentDetail doc={selectedDoc} onClose={() => setSelectedDoc(null)} onDelete={handleDelete} />
      )}

      {showAddDoc && (
        <AddDocumentModal onClose={() => setShowAddDoc(false)} />
      )}
    </div>
  );
}
