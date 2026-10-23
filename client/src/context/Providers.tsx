"use client";

import type { ComponentType, ReactNode } from "react";
import { UsersProvider } from "./UsersContext";
import { SessionProvider } from "./SessionContext";
import { PostsProvider } from "./PostsContext";
import { NotificationsProvider } from "./NotificationsContext";
import { RequestsProvider } from "./RequestContext";
import { DataGate } from "./DataGate";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Registro centralizado de Providers en TrueK
const providers: ProviderComponent[] = [
  UsersProvider,
  SessionProvider,
  // --- Person 1 ---
  PostsProvider, 
  // --- Person 2 ---
  NotificationsProvider,
  RequestsProvider,

  // --- Person 3 ---
];

export function Providers({ children }: { children: ReactNode }) {
  return providers.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <DataGate>{children}</DataGate>,
  );
}