"use client";

import type { ComponentType, ReactNode } from "react";
import { SessionProvider } from "./SessionContext";
import { NotificationsProvider } from "./NotificationsContext";
import { RequestsProvider } from "./RequestContext";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Every context Provider of the app is registered HERE, in one place.
// To add yours: import it at the top and add ONE line inside your own section.
const providers: ProviderComponent[] = [
  // --- Shared with all persons ---
  SessionProvider,
  // --- Person 1 ---

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