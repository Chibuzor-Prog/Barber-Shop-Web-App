
import React, { createContext, useContext, useState } from "react";
import { User, users as mockUsers } from "../data/mockUsers";

type AuthContextType = {
  user: User | null;
  tempUser: User | null;
  login: (user: User) => void;
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

  // Step 1: Called from Login
  const login = (user: User) => {
    setTempUser(user);
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
