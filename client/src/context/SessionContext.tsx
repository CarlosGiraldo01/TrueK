"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useUsers } from "./UsersContext";
import type { UpdateUserInput, User, UserRole } from "@/types";

interface SessionContextValue {
  user: User | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  switchRole: () => void;
  updateUser: (updatedData: UpdateUserInput) => Promise<User>;
  login: (userId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Usuario por defecto al abrir la app por primera vez (Valentina)
const DEFAULT_USER_ID = "122baf6d-1d30-44ee-8ee1-77a7695d4ff1";

const SESSION_USER_KEY = "truek_session_user_id";
const SESSION_ROLE_KEY = "truek_session_active_role";

// Proveedor para manejar la sesión y el rol del usuario actual
export function SessionProvider({ children }: { children: ReactNode }) {
  const { getUserById, updateUser } = useUsers();

  // Rol activo guardado en localStorage
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

  // ID del usuario logueado actualmente
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

  // Guardar sesión en localStorage cuando cambie el usuario o el rol
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

  const user = userId ? (getUserById(userId) ?? null) : null;
  const activeRole: UserRole = overrideRole ?? user?.role ?? "client";

  // Cambiar de rol y asignar el usuario representativo (u2 para proveedor, u3 para cliente)
  const handleSetRole = (role: UserRole) => {
    setOverrideRole(role);
    if (role === "provider") {
      setUserId("122baf6d-1d30-44ee-8ee1-77a7695d4ff1");
    } else {
      setUserId("744da244-6cad-4f07-afca-68dde5c7fb3b");
    }
  };

  // Iniciar sesión con un ID específico
  const handleLogin = (id: string) => {
    setUserId(id);
    const targetUser = getUserById(id);
    if (targetUser) {
      setOverrideRole(targetUser.role);
    } else {
      setOverrideRole(null);
    }
  };

  // Cerrar sesión y limpiar el almacenamiento
  const handleLogout = () => {
    setUserId(null);
    setOverrideRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_ROLE_KEY);
    }
  };

  // Cambiar rápido entre proveedor y cliente
  const handleSwitchRole = () => {
    const nextRole: UserRole = activeRole === "provider" ? "client" : "provider";
    handleSetRole(nextRole);
  };

  // Actualizar datos del usuario actual
  const handleUpdateUser = async (updatedData: UpdateUserInput): Promise<User> => {
    if (!userId) throw new Error("Debes iniciar sesión para editar tu perfil");
    return updateUser(userId, updatedData);
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

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}