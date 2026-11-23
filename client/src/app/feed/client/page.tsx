"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

// Feed del cliente: si un prestador entra aquí, lo mandamos a su propio feed
export default function ClientFeedPage() {
  const router = useRouter();
  const { activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "client") {
      router.replace("/feed/provider");
    }
  }, [activeRole, router]);

  if (activeRole !== "client") return null;

  return <FeedView />;
}
