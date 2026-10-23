"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface UsersContextValue {

  users: User[];
  loading: boolean;
  error: string | null;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, data: Partial<User>) => void;
}

const UsersContext = createContext<UsersContextValue | null>(null);

const EDITS_KEY = "truek_users_edits";

function readEdits(): Record<string, Partial<User>> {
  try {
    const saved = localStorage.getItem(EDITS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<User[]>("/users")
      .then((res) => {
        if (cancelled) return;
        const edits = readEdits();
        setUsers(res.data.map((u) => ({ ...u, ...edits[u.id] })));
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los usuarios");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

const getUserById = useCallback((id: string) => users.find((u) => u.id === id), [users]);
const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    try {
      const edits = readEdits();
      localStorage.setItem(EDITS_KEY, JSON.stringify({ ...edits, [id]: { ...edits[id], ...data } }));
    } catch (e) {
      console.error("Error saving user changes:", e);
    }
  }, []);

  return (
    <UsersContext.Provider value={{ users, loading, error, getUserById, updateUser }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used inside UsersProvider");
  return ctx;
}