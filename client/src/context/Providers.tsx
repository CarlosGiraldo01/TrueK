"use client";

import type { ComponentType, ReactNode } from "react";
import { SessionProvider } from "./SessionContext";
import { NotificationsProvider } from "./NotificationsContext";
import { RequestsProvider } from "./RequestContext";
import { PostsProvider } from "./PostsContext";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Registro centralizado de Providers en TrueK
const providers: ProviderComponent[] = [
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
    children,
  );
}
