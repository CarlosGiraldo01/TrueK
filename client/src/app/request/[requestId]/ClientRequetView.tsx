"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;
  provider: User | undefined;
  imageUrl: string;
}

// What the client sees while the request is not active: pending, rejected, finished or cancelled.
export function ClientRequestView({ request, provider, imageUrl }: Props) {
  const router = useRouter();
  const { closeRequest } = useRequests();
  const providerName = provider?.name ?? "El prestador";

  if (request.status === "rejected") {
    const handleSearch = () => {
      closeRequest(request.id);
      router.push("/search");
    };
    return (
      <ServiceDetailCard
        person={provider}
        request={request}
        imageUrl={imageUrl}
        badge={<StatusBadge label="Rechazado" tone="orange" />}
      >
        <p className="mt-5 text-center text-sm text-white/80">{providerName} no pudo aceptar tu solicitud.</p>
        <div className="mx-auto mt-4 w-full max-w-60">
          <Button variant="accent" onClick={handleSearch}>
            Buscar otro servicio
          </Button>
        </div>
      </ServiceDetailCard>
    );
  }

  if (request.status === "finished") {
    return (
      <ServiceDetailCard
        person={provider}
        request={request}
        imageUrl={imageUrl}
        badge={<StatusBadge label="Finalizado" />}
      >
        <p className="mt-5 text-center text-sm text-white/80">Tu servicio con {providerName} ha terminado.</p>
        <div className="mx-auto mt-4 w-full max-w-60">
          <Button onClick={() => router.push(`/requests/${request.id}/rating`)}>Calificar servicio</Button>
        </div>
      </ServiceDetailCard>
    );
  }

  if (request.status === "cancelled") {
    return (
      <ServiceDetailCard
        person={provider}
        request={request}
        imageUrl={imageUrl}
        badge={<StatusBadge label="Cancelado" tone="muted" />}
      />
    );
  }

  // Pending: waiting for the provider's answer.
  return (
    <ServiceDetailCard
      person={provider}
      request={request}
      imageUrl={imageUrl}
      badge={<StatusBadge label="En proceso..." tone="muted" />}
    >
      <p className="mt-5 text-center text-sm text-white/80">
        Esperando la respuesta de {providerName}. Te avisaremos cuando responda.
      </p>
      <Link
        href={`/chat/${request.id}`}
        className="mx-auto mt-4 flex h-9 w-full max-w-60 items-center justify-center rounded-[10px] border border-truek-lime text-base font-bold text-truek-lime transition-transform active:scale-[0.98]"
      >
        Abrir chat
      </Link>
    </ServiceDetailCard>
  );
}
