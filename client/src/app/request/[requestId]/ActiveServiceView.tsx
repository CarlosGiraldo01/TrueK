"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui";
import { useRequests, type RequestRole } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;
  person: User | undefined; // The provider when the client looks, the client when the provider looks.
  role: RequestRole;
  imageUrl: string;
}

// "Servicio activo": the service is happening. Same card for both, with different actions.
export function ActiveServiceView({ request, person, role, imageUrl }: Props) {
  const { finishRequest, simulateProviderFinish } = useRequests();
  const isClient = role === "client";

  // Simulation: when the client is looking, after a while the provider finishes the service.
  useEffect(() => {
    if (!isClient) return;
    return simulateProviderFinish(request.id);
  }, [isClient, request.id, simulateProviderFinish]);

  const chatBadge = (
    <Link
      href={`/chat/${request.id}`}
      aria-label="Abrir chat"
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-truek-lime bg-truek-lime/15 px-3 py-0.5 text-xs font-semibold text-truek-lime transition-opacity active:opacity-70"
    >
      <ChatBubbleOvalLeftEllipsisIcon className="size-4" strokeWidth={2} />
      Chat
    </Link>
  );

  return (
    <ServiceDetailCard
      person={person}
      request={request}
      imageUrl={imageUrl}
      badge={isClient ? <StatusBadge label={request.status === "accepted" ? "Aceptado" : "Activo"} /> : chatBadge}
    >
      {isClient ? (
        <>
          <p className="mt-5 text-center text-xs text-white/70">
            Cuando {person?.name ?? "el prestador"} dé por finalizado el servicio, te avisaremos para calificarlo.
          </p>
          <Link
            href={`/chat/${request.id}`}
            className="mx-auto mt-4 flex h-9 w-full max-w-60 items-center justify-center gap-2 rounded-[10px] bg-truek-lime text-base font-bold text-truek-black transition-transform active:scale-[0.98]"
          >
            <ChatBubbleOvalLeftEllipsisIcon className="size-5" strokeWidth={2} />
            Abrir chat
          </Link>
        </>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-60">
          {/* The screen turns into "Servicio finalizado". */}
          <Button onClick={() => finishRequest(request.id)}>Dar por finalizado</Button>
        </div>
      )}
    </ServiceDetailCard>
  );
}