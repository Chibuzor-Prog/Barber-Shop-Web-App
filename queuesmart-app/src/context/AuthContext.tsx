import React, { createContext, useContext, useState } from "react";

type AuthUser = {
  email: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: AuthUser | null;
  tempUser: AuthUser | null;
  login: (email: string) => void;
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
  const [user, setUser] = useState<AuthUser | null>(() =>
    JSON.parse(localStorage.getItem("authUser") || "null")
  );

  const [tempUser, setTempUser] = useState<AuthUser | null>(null);

  // Step 1: Called from Login
  const login = (email: string) => {
    const role: "admin" | "user" =
      email === "admin@salon.com" ? "admin" : "user";

    setTempUser({ email, role }); // Not saved yet
  };

  // Step 2: Called from OTP page
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
