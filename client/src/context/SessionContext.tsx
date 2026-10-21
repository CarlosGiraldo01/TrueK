"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_USER_ID, getUserById, type User } from "@/lib/mock";

type SessionContextValue = {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {

  const [userId, setUserId] = useState<string | null>(CURRENT_USER_ID);

  const user = userId ? (getUserById(userId) ?? null) : null;

  const value: SessionContextValue = {
    user,
    login: setUserId,
    logout: () => setUserId(null),
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