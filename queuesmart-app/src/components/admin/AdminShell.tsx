

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth }       from "../../context/AuthContext";
import AdminLayout       from "./AdminLayout";
import Notifications     from "../common/Notifications";
import SmartAssistant    from "../common/SmartAssistant-Gemini";

const AdminShell: React.FC = () => {
  const { user } = useAuth();

  if (!user)                  return <Navigate to="/" replace />;
  if (user.role !== "admin")  return <Navigate to="/user/dashboard" replace />;

  return (
    <AdminLayout>
      <Notifications />
      <Outlet />
      {/* ── AI Smart Assistant — available on every admin page ── */}
      <SmartAssistant />
    </AdminLayout>
  );
};

export default AdminShell;
