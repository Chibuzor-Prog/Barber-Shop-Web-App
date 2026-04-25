// src/App.tsx
// Root application component — defines all routes.
// Uses React Router v6 nested routes with AdminShell / UserShell as guards.

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";

// Auth pages
import Login            from "./components/auth/Login";
import Register         from "./components/auth/Register";
import OTPVerification  from "./components/auth/OTPVerification";

// Protected shells (layout + auth guard)
import AdminShell from "./components/admin/AdminShell";
import UserShell  from "./components/user/UserShell";

// Admin pages
import AdminDashboard    from "./components/admin/AdminDashboard";
import QueueManagement   from "./components/admin/QueueManagement";
import ServiceManagement from "./components/admin/ServiceManagement";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard";

// User pages
import Dashboard   from "./components/user/Dashboard";
import JoinQueue   from "./components/user/JoinQueue";
import QueueStatus from "./components/user/QueueStatus";
import History     from "./components/user/History";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Public routes ───────────────────────────────────────── */}
            <Route path="/"         element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp"      element={<OTPVerification />} />

            {/* ── Admin routes (AdminShell checks role === "admin") ──── */}
            <Route path="/admin" element={<AdminShell />}>
              <Route index                element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<AdminDashboard />} />
              <Route path="queue"         element={<QueueManagement />} />
              <Route path="services"      element={<ServiceManagement />} />
              <Route path="analytics"     element={<AnalyticsDashboard />} />
            </Route>

            {/* ── User routes (UserShell checks user is logged in) ───── */}
            <Route path="/user" element={<UserShell />}>
              <Route index             element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="join"       element={<JoinQueue />} />
              <Route path="status"     element={<QueueStatus />} />
              <Route path="history"    element={<History />} />
            </Route>

            {/* ── Catch-all → login ──────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
};

export default App;
