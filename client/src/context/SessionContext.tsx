"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { CURRENT_USER_ID, USERS, getUserById, type User, type UserRole } from "@/lib/mock";

interface SessionContextValue {
  user: User | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  switchRole: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  login: (userId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SESSION_USER_KEY = "truek_session_user_id";
const SESSION_USERS_DATA_KEY = "truek_users_data";
const SESSION_ROLE_KEY = "truek_session_active_role";

export function SessionProvider({ children }: { children: ReactNode }) {
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

  // Guardar en localStorage
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

  const user = userId ? (usersList.find((u) => u.id === userId) ?? getUserById(userId) ?? null) : null;
  const activeRole: UserRole = overrideRole ?? user?.role ?? "client";

  const handleSetRole = (role: UserRole) => {
    setOverrideRole(role);
    if (role === "provider") {
      setUserId("u2"); // Valentina Arias (Prestador)
    } else {
      setUserId("u3"); // Camila restrepo (Cliente)
    }
  };

  const handleLogin = (id: string) => {
    setUserId(id);
    const targetUser = usersList.find((u) => u.id === id) ?? getUserById(id);
    if (targetUser) {
      setOverrideRole(targetUser.role);
    } else {
      setOverrideRole(null);
    }
  };

  const handleLogout = () => {
    setUserId(null);
    setOverrideRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_ROLE_KEY);
    }
  };

  const handleSwitchRole = () => {
    const nextRole: UserRole = activeRole === "provider" ? "client" : "provider";
    handleSetRole(nextRole);
  };

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

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
