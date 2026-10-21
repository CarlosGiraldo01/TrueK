"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CURRENT_USER_ID, getUserById, type User } from "@/lib/mock";

/**
 * Interfaz de valores y métodos expuestos por el contexto de sesión de TrueK.
 */
interface SessionContextValue {
  /** Usuario actualmente autenticado */
  user: User | null;
  login: (userId: string) => void;
  /** Cierra la sesión activa y limpia el almacenamiento local */
  logout: () => void;
}

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

/**
 * Hook para consumir los métodos y valores de SessionContext.
 */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}