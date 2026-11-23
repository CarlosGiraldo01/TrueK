"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

// Feed del prestador: si un cliente entra aquí, lo mandamos a su propio feed
export default function ProviderFeedPage() {
  const router = useRouter();
  const { activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "provider") {
      router.replace("/feed/client");
    }
  }, [activeRole, router]);

  if (activeRole !== "provider") return null;

  return <FeedView />;
}
