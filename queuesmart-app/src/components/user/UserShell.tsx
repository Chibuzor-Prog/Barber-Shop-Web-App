// src/user/UserShell.tsx
// Protected route wrapper for user pages.
// Includes SmartAssistant floating AI chatbot (bottom-right).

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth }       from "../../context/AuthContext";
import UserLayout        from "./UserLayout";
import Notifications     from "../common/Notifications";
import SmartAssistant    from "../common/SmartAssistant-Gemini";

const UserShell: React.FC = () => {
  const { user } = useAuth();

  if (!user)                return <Navigate to="/" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  return (
    <UserLayout>
      <Notifications />
      <Outlet />
      {/* ── AI Smart Assistant — available on every user page ── */}
      <SmartAssistant />
    </UserLayout>
  );
};

export default UserShell;
