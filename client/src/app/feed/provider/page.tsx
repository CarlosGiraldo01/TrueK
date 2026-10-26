"use client";

import { useEffect } from "react";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

// Vista del feed para el prestador (aquí sí forzamos el rol para que salga todo lo de proveedor)
export default function ProviderFeedPage() {
  const { setActiveRole, activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "provider") {
      setActiveRole("provider");
    }
  }, [activeRole, setActiveRole]);

  return <FeedView forcedRole="provider" />;
}