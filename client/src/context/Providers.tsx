"use client";

import type { ReactNode } from "react";
import { UsersProvider } from "./UsersContext";
import { SessionProvider } from "./SessionContext";
import { PostsProvider } from "./PostsContext";
import { NotificationsProvider } from "./NotificationsContext";
import { RequestsProvider } from "./RequestContext";
import { DataGate } from "./DataGate";

// Juntamos todos los providers del equipo aquí para ordenarnos
export function Providers({ children }: { children: ReactNode }) {
  return (
    <UsersProvider>
      <SessionProvider>
        {/* Posts */}
        <PostsProvider>
          {/* Notis y solicitudes */}
          <NotificationsProvider>
            <RequestsProvider>
              <DataGate>{children}</DataGate>
            </RequestsProvider>
          </NotificationsProvider>
        </PostsProvider>
      </SessionProvider>
    </UsersProvider>
  );
}