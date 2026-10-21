"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { CURRENT_USER_ID, USERS, getUserById, type User, type UserRole } from "@/lib/mock";

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

const SESSION_USER_KEY = "truek_session_user_id";
const SESSION_USERS_DATA_KEY = "truek_users_data";
const SESSION_ROLE_KEY = "truek_session_active_role";

/**
 * Proveedor de contexto de sesión:
 * Administra el usuario activo, su rol en la aplicación y la persistencia
 * duradera en el navegador mediante localStorage.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // Lista de usuarios con datos persistentes
  const [usersList, setUsersList] = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SESSION_USERS_DATA_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading users from storage:", e);
      }
    }
    return USERS;
  });

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
    return CURRENT_USER_ID;
  });

  /**
   * Efecto de sincronización con localStorage:
   * Almacena o remueve las claves de sesión cada vez que cambian el usuario, rol o lista de usuarios.
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
        localStorage.setItem(SESSION_USERS_DATA_KEY, JSON.stringify(usersList));
      } catch (e) {
        console.error("Error saving session to storage:", e);
      }
    }
  }, [userId, overrideRole, usersList]);

  // Instancia del usuario actual resuelto desde el estado o los mocks
  const user = userId ? (usersList.find((u) => u.id === userId) ?? getUserById(userId) ?? null) : null;
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
    const targetUser = usersList.find((u) => u.id === id) ?? getUserById(id);
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
   * Actualiza los datos personales del usuario actual y los sincroniza en la lista global.
   * 
   * @param updatedData - Objeto parcial con las propiedades modificadas del usuario.
   */
  const handleUpdateUser = (updatedData: Partial<User>) => {
    if (!userId) return;

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updatedData };
          const mockUser = USERS.find((m) => m.id === userId);
          if (mockUser) Object.assign(mockUser, updatedData);
          return updated;
        }
        return u;
      })
    );
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
