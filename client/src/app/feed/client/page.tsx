"use client";

import { useEffect } from "react";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

// Forzamos el rol a cliente por si entra directo acá
export default function ClientFeedPage() {
  const { setActiveRole, activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "client") {
      setActiveRole("client");
    }
  }, [activeRole, setActiveRole]);

  return <FeedView forcedRole="client" />;
}