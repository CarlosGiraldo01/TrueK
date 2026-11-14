"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { UpdateUserInput, User } from "@/types";

interface UsersContextValue {

  users: User[];
  loading: boolean;
  error: string | null;
  getUserById: (id: string) => User | undefined;
  updateUser: (id: string, data: UpdateUserInput) => Promise<User>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

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
        setUsers(res.data);
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
const updateUser = useCallback(async (id: string, data: UpdateUserInput): Promise<User> => {
    const res = await api.patch<User>(`/users/${id}`, { user_id: id, ...data });
    setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    return res.data;
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