"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useUsers } from "./UsersContext";
import type { UpdateUserInput, User, UserRole } from "@/types";

interface SessionContextValue {
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  switchRole: () => void;
  updateUser: (updatedData: UpdateUserInput) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => Promise<User>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_TOKEN_KEY = "truek_token";
const SESSION_USER_KEY = "truek_user";
const SESSION_ROLE_KEY = "truek_session_active_role";

// Proveedor para manejar la sesión real y el rol del usuario actual
export function SessionProvider({ children }: { children: ReactNode }) {
  const { getUserById, updateUser } = useUsers();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Cargar sesión guardada al abrir la app
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const savedUser = localStorage.getItem(SESSION_USER_KEY);
      const savedRole = localStorage.getItem(SESSION_ROLE_KEY) as UserRole | null;

      if (savedToken && savedUser) {
        setCurrentUser(JSON.parse(savedUser) as User);
      }
      if (savedRole === "provider" || savedRole === "client") {
        setOverrideRole(savedRole);
      }
    } catch (e) {
      console.error("Error reading session from storage:", e);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Sincroniza con UsersContext si hay datos más recientes, sin perder el usuario recién creado
  const user = currentUser ? (getUserById(currentUser.id) ?? currentUser) : null;
  const activeRole: UserRole = overrideRole ?? user?.role ?? "client";

  // Iniciar sesión real contra el servidor
  const handleLogin = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(SESSION_ROLE_KEY, data.user.role);
    setCurrentUser(data.user);
    setOverrideRole(data.user.role);
    return data.user;
  };

  // Crear cuenta nueva en el servidor e iniciar sesión
  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = "client",
  ): Promise<User> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/register", {
      name,
      email,
      password,
      role,
    });
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(SESSION_ROLE_KEY, data.user.role);
    setCurrentUser(data.user);
    setOverrideRole(data.user.role);
    return data.user;
  };

  // Cerrar sesión y borrar todo el almacenamiento
  const handleLogout = () => {
    setCurrentUser(null);
    setOverrideRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_ROLE_KEY);
    }
  };

  // Cambiar vista entre cliente y prestador para el usuario actual
  const handleSetRole = (role: UserRole) => {
    setOverrideRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_ROLE_KEY, role);
    }
  };

  const handleSwitchRole = () => {
    const nextRole: UserRole = activeRole === "provider" ? "client" : "provider";
    handleSetRole(nextRole);
  };

  // Actualizar datos del usuario actual
  const handleUpdateUser = async (updatedData: UpdateUserInput): Promise<User> => {
    if (!user) throw new Error("Debes iniciar sesión para editar tu perfil");
    const updated = await updateUser(user.id, updatedData);
    setCurrentUser(updated);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const value: SessionContextValue = {
    user,
    isReady,
    isAuthenticated: Boolean(user),
    activeRole,
    setActiveRole: handleSetRole,
    switchRole: handleSwitchRole,
    updateUser: handleUpdateUser,
    login: handleLogin,
    register: handleRegister,
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