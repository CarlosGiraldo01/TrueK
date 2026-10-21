"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_USER_ID, getUserById, type User, type UserRole } from "@/lib/mock";

type SessionContextValue = {
  user: User | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  switchRole: () => void;
  login: (userId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(CURRENT_USER_ID);
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

  const user = userId ? (getUserById(userId) ?? null) : null;
  const activeRole: UserRole = overrideRole ?? user?.role ?? "client";

  const handleLogin = (id: string) => {
    setUserId(id);
    setOverrideRole(null);
  };

  const handleLogout = () => {
    setUserId(null);
    setOverrideRole(null);
  };

  const handleSwitchRole = () => {
    setOverrideRole((prev) => {
      const current = prev ?? user?.role ?? "client";
      return current === "provider" ? "client" : "provider";
    });
  };

  const value: SessionContextValue = {
    user,
    activeRole,
    setActiveRole: setOverrideRole,
    switchRole: handleSwitchRole,
    login: handleLogin,
    logout: handleLogout,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
