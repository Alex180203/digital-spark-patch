import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider } from "./components/lazi-ui/Toast";
import { AppLayout } from "./components/layout/AppLayout";

import { LandingScreen } from "./screens/LandingScreen";
import { LoginRoeIdScreen } from "./screens/LoginRoeIdScreen";
import { LoginCeiNfcScreen } from "./screens/LoginCeiNfcScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DocumentsScreen } from "./screens/DocumentsScreen";
import { RequestsScreen } from "./screens/RequestsScreen";
import { DelegationsScreen } from "./screens/DelegationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { LedgerScreen } from "./screens/LedgerScreen";
import { IdRenewalScreen } from "./screens/IdRenewalScreen";
import { ClerkScreen } from "./screens/ClerkScreen";
import { DeclaratiiScreen } from "./screens/DeclaratiiScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { RulesScreen } from "./screens/RulesScreen";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function CitizenOnlyRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (state.currentRole !== "citizen") {
    return <Navigate to="/notifications" replace />;
  }
  return <>{children}</>;
}

function ClerkOnlyRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (state.currentRole !== "clerk") {
    return <Navigate to="/notifications" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useApp();

  return (
    <Routes>
      <Route
        path="/"
        element={state.isAuthenticated ? <Navigate to="/notifications" replace /> : <LandingScreen />}
      />
      <Route
        path="/login/roeid"
        element={state.isAuthenticated ? <Navigate to="/notifications" replace /> : <LoginRoeIdScreen />}
      />
      <Route
        path="/login/cei-nfc"
        element={state.isAuthenticated ? <Navigate to="/notifications" replace /> : <LoginCeiNfcScreen />}
      />

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/documents" element={<DocumentsScreen />} />
        <Route path="/requests" element={<RequestsScreen />} />
        <Route path="/delegations" element={<DelegationsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/ledger" element={<LedgerScreen />} />
        <Route path="/declaratii" element={<DeclaratiiScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/rules" element={<RulesScreen />} />
        <Route path="/id-renewal" element={<CitizenOnlyRoute><IdRenewalScreen /></CitizenOnlyRoute>} />
        <Route path="/clerk" element={<ClerkOnlyRoute><ClerkScreen /></ClerkOnlyRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
}
