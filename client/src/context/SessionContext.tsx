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

// Proveedor para manejar la sesión real y el rol del usuario actual
export function SessionProvider({ children }: { children: ReactNode }) {
  const { getUserById, updateUser } = useUsers();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Cargar sesión guardada al abrir la app
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const savedUser = localStorage.getItem(SESSION_USER_KEY);

      if (savedToken && savedUser) {
        setCurrentUser(JSON.parse(savedUser) as User);
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
  // El rol es el de la cuenta (se elige al registrarse). Un cliente nunca ve pantallas de prestador.
  const activeRole: UserRole = user?.role ?? "client";

  // Iniciar sesión real contra el servidor
  const handleLogin = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
    setCurrentUser(data.user);
    return data.user;
  };

  // Crear cuenta nueva en el servidor e iniciar sesión
  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = "client",
  ): Promise<User> => {
    // Se cierra la sesión anterior: si el registro falla, no queda abierta la cuenta de otra persona
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setCurrentUser(null);
    const { data } = await api.post<{ token: string; user: User }>("/auth/register", {
      name,
      email,
      password,
      role,
    });
    localStorage.setItem(SESSION_TOKEN_KEY, data.token);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
    setCurrentUser(data.user);
    return data.user;
  };

  // Cerrar sesión y borrar todo el almacenamiento
  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
    }
  };

  // Actualizar datos del usuario actual
  const handleUpdateUser = async (updatedData: UpdateUserInput): Promise<User> => {
    // Se usa el usuario guardado en el navegador: justo después de registrarse el estado de React
    // todavía tiene el valor anterior, y así nunca se edita la cuenta de otra persona.
    const savedUser = localStorage.getItem(SESSION_USER_KEY);
    const current = savedUser ? (JSON.parse(savedUser) as User) : user;
    if (!current) throw new Error("Debes iniciar sesión para editar tu perfil");
    const updated = await updateUser(current.id, updatedData);
    setCurrentUser(updated);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const value: SessionContextValue = {
    user,
    isReady,
    isAuthenticated: Boolean(user),
    activeRole,
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