"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#161615] text-sm text-white/70">
        Verificando sesión...
      </div>
    );
  }

  return <>{children}</>;
}