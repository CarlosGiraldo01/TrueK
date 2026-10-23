"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useUsers } from "./UsersContext";
import type { User, UserRole } from "@/types";

/**
 * Interfaz de valores y métodos expuestos por el contexto de sesión de TrueK.
 */
interface SessionContextValue {
  /** Usuario actualmente autenticado */
  user: User | null;
  /** Rol activo del usuario ('provider' o 'client') */
  activeRole: UserRole;
  /** Conmuta explícitamente el rol activo sincronizando el usuario representativo */
  setActiveRole: (role: UserRole) => void;
  /** Alterna rápidamente entre rol de proveedor y cliente */
  switchRole: () => void;
  /** Actualiza los datos del usuario activo y los persiste en localStorage */
  updateUser: (updatedData: Partial<User>) => void;
  /** Inicia sesión con un ID de usuario */
  login: (userId: string) => void;
  /** Cierra la sesión activa y limpia el almacenamiento local */
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Usuario con el que se abre la app la primera vez (Valentina, proveedora)
const DEFAULT_USER_ID = "u2";

const SESSION_USER_KEY = "truek_session_user_id";
const SESSION_ROLE_KEY = "truek_session_active_role";

/**
 * Proveedor de contexto de sesión:
 * Administra el usuario activo, su rol en la aplicación y la persistencia
 * duradera en el navegador mediante localStorage.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // Los usuarios vienen del servidor a través de UsersContext
  const { getUserById, updateUser } = useUsers();

  // Rol activo forzado o almacenado
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_ROLE_KEY) as UserRole | null;
        if (saved === "provider" || saved === "client") return saved;
      } catch (e) {
        console.error("Error reading role from storage:", e);
      }
    }
    return null;
  });

  // ID del usuario autenticado en la sesión actual
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_USER_KEY);
        if (saved) return saved;
      } catch (e) {
        console.error("Error reading session from storage:", e);
      }
    }
    return DEFAULT_USER_ID;
  });

  /**
   * Efecto de sincronización con localStorage:
   * Almacena o remueve las claves de sesión cada vez que cambian el usuario o el rol.
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (userId) {
          localStorage.setItem(SESSION_USER_KEY, userId);
        } else {
          localStorage.removeItem(SESSION_USER_KEY);
        }
        if (overrideRole) {
          localStorage.setItem(SESSION_ROLE_KEY, overrideRole);
        } else {
          localStorage.removeItem(SESSION_ROLE_KEY);
        }
      } catch (e) {
        console.error("Error saving session to storage:", e);
      }
    }
  }, [userId, overrideRole]);

  // Instancia del usuario actual, buscada entre los usuarios del servidor
  const user = userId ? (getUserById(userId) ?? null) : null;
  const activeRole: UserRole = overrideRole ?? user?.role ?? "client";

  /**
   * Conmuta el rol activo y vincula automáticamente el usuario representativo:
   * - 'provider': Asigna a Valentina Arias (id: 'u2', Prestador).
   * - 'client': Asigna a Camila restrepo (id: 'u3', Cliente).
   *
   * @param role - Rol a activar.
   */
  const handleSetRole = (role: UserRole) => {
    setOverrideRole(role);
    if (role === "provider") {
      setUserId("u2");
    } else {
      setUserId("u3");
    }
  };

  /**
   * Inicia sesión con el usuario correspondiente al ID provisto.
   *
   * @param id - Identificador del usuario.
   */
  const handleLogin = (id: string) => {
    setUserId(id);
    const targetUser = getUserById(id);
    if (targetUser) {
      setOverrideRole(targetUser.role);
    } else {
      setOverrideRole(null);
    }
  };

  /**
   * Cierra la sesión activa y purga las claves de localStorage.
   */
  const handleLogout = () => {
    setUserId(null);
    setOverrideRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_ROLE_KEY);
    }
  };

  /**
   * Alterna entre el rol de proveedor y cliente.
   */
  const handleSwitchRole = () => {
    const nextRole: UserRole = activeRole === "provider" ? "client" : "provider";
    handleSetRole(nextRole);
  };

  /**
   * Actualiza los datos personales del usuario actual (UsersContext los guarda).
   *
   * @param updatedData - Objeto parcial con las propiedades modificadas del usuario.
   */
  const handleUpdateUser = (updatedData: Partial<User>) => {
    if (!userId) return;

    updateUser(userId, updatedData);
  };

  const value: SessionContextValue = {
    user,
    activeRole,
    setActiveRole: handleSetRole,
    switchRole: handleSwitchRole,
    updateUser: handleUpdateUser,
    login: handleLogin,
    logout: handleLogout,
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