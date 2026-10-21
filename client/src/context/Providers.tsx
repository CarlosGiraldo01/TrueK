"use client";

import type { ComponentType, ReactNode } from "react";
import { SessionProvider } from "./SessionContext";
import { PostsProvider } from "./PostsContext";

type ProviderComponent = ComponentType<{ children: ReactNode }>;

// Registro centralizado de Providers en TrueK
const providers: ProviderComponent[] = [
  SessionProvider,
  PostsProvider,
];

export function Providers({ children }: { children: ReactNode }) {
  return providers.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children,
  );
}
