// src/context/AuthContext.tsx
// ── CHANGED: login() now calls the backend /auth/login API instead of filtering mockUsers.
//    logout() now also clears authUser from localStorage (kept for session persistence).
//    User type is defined locally here; mockUsers import removed entirely.

import React, { createContext, useContext, useState } from "react";
import { authApi } from "../api/api";

// ── CHANGED: User type defined here — no longer imported from mockUsers
export type User = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  tempUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  verifyOTP: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext missing");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("authUser");
    return stored ? JSON.parse(stored) : null;
  });

  const [tempUser, setTempUser] = useState<User | null>(null);

  // ── CHANGED: login is now async and calls backend /auth/login
  //    On success, stores the returned user as tempUser for OTP step
  const login = async (email: string, password: string): Promise<void> => {
    const data = await authApi.login(email, password);
    // Backend returns { message, user }
    setTempUser(data.user as User);
  };

  // Step 2: Called from OTP page — unchanged logic, kept localStorage for session
  const verifyOTP = () => {
    if (!tempUser) return;
    localStorage.setItem("authUser", JSON.stringify(tempUser));
    setUser(tempUser);
    setTempUser(null);
  };

  const logout = () => {
    localStorage.removeItem("authUser");
    setUser(null);
    setTempUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, tempUser, login, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};