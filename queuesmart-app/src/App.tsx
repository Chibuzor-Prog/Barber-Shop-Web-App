import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import OTPVerification from "./components/auth/OTPVerification";
import Dashboard from "./components/user/Dashboard";
import JoinQueue from "./components/user/JoinQueue";
import QueueStatus from "./components/user/QueueStatus";
import History from "./components/user/History";
import AdminShell from "./components/admin/AdminShell";
import AdminDashboard from "./components/admin/AdminDashboard";
import { QueueProvider } from "./context/QueueContext";
import Notifications from "./components/common/Notifications";
import QueueManagement from "./components/admin/QueueManagement";
import ServiceManagement from "./components/admin/ServiceManagement";
import AnalyticsDashboard from "./components/admin/AnalyticsDashboard";
import { ui } from "./styles/ui";

const App: React.FC = () => (
  <QueueProvider>
    <Router>
      <Notifications />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp" element={<OTPVerification />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/join-queue" element={<JoinQueue />} />
            <Route path="/queue-status" element={<QueueStatus />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<AdminShell />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="queue" element={<QueueManagement />} />
              <Route path="services" element={<ServiceManagement />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
            </Route>
          </Routes>
        </div>
    </Router>
  </QueueProvider>
);

export default App;