

import React, { createContext, useContext, useState } from "react";
import { authApi } from "../api/api";

// User type matching backend response shape
export type User = {
  id:    string;   // MongoDB ObjectId string
  name:  string;
  email: string;
  role:  "user" | "admin";
};

type AuthContextType = {
  user:      User | null;
  tempUser:  User | null;
  login:     (email: string, password: string) => Promise<void>;
  verifyOTP: () => void;
  logout:    () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext missing");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("authUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [tempUser, setTempUser] = useState<User | null>(null);

  // Step 1: Called from Login page — authenticates against backend
  const login = async (email: string, password: string): Promise<void> => {
    const data = await authApi.login(email, password);
    // Backend returns { message, user: { id, name, email, role } }
    // id is a MongoDB ObjectId string — no password is ever stored here
    setTempUser(data.user as User);
  };

  // Step 2: Called from OTP page after code verification
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
