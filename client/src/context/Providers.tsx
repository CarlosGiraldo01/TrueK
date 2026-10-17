"use client";

import type { ComponentType, ReactNode } from "react";
import { SessionProvider } from "./SessionContext";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Every context Provider of the app is registered HERE, in one place.
// To add yours: import it at the top and add ONE line inside your own section.
const providers: ProviderComponent[] = [
  // --- Shared with all members ---
    SessionProvider,
  // --- Member 1 ---

  // --- Member 2 ---

  // --- Member 3 ---
];

export function Providers({ children }: { children: ReactNode }) {
  // The first provider of the list ends up as the outermost one.
  return providers.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children,
  );
}