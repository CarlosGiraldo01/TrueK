"use client";

import type { ReactNode } from "react";
import { useUsers } from "./UsersContext";
import { usePosts } from "./PostsContext";
import { useRequests } from "./RequestContext";

export function DataGate({ children }: { children: ReactNode }) {
  const users = useUsers();
  const posts = usePosts();
  const requests = useRequests();

  const error = users.error ?? posts.error ?? requests.error;
  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-white">{error}</p>
        <p className="text-xs text-truek-placeholder">Revisa que el servidor esté encendido e intenta de nuevo.</p>
      </div>
    );
  }

  if (users.loading || posts.loading || requests.loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-truek-placeholder">Cargando...</p>
      </div>
    );
  }
  return <>{children}</>;
}