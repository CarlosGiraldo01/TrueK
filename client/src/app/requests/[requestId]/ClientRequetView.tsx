"use client";

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

//vista del cliente cuando el servicio no pas ahora mismo
export function ClientRequestView({ request, provider, imageUrl }: Props) {
  const router = useRouter();
  const { closeRequest } = useRequests();//se pide y se cierra
  const providerName = provider?.name ?? "El prestador";
//condicion de que si se rechaza 
  if (request.status === "rejected") {
    const handleSearch = () => {//se cierra la peticion 
      closeRequest(request.id);
      router.push("/search");
    };
    //se dibuja la tarjeta 
    return (
      <ServiceDetailCard person={provider} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Rechazado" tone="orange" />}>
        <p className="mt-5 text-center text-sm text-white/80">{providerName} no pudo aceptar tu solicitud.</p>
        <div className="mx-auto mt-4 w-full max-w-60">
          <Button variant="accent" onClick={handleSearch}>
            Buscar otro servicio
          </Button>
        </div>
      </ServiceDetailCard>
    );
  }
//condicion que dice que ya se acabo el trabajo
  if (request.status === "finished") {
    return (<ServiceDetailCard person={provider} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Finalizado" />}>
        <p className="mt-5 text-center text-sm text-white/80">Tu servicio con {providerName} ha terminado.</p>
        <div className="mx-auto mt-4 w-full max-w-60">
          <Button onClick={() => router.push(`/requests/${request.id}/rating`)}>Calificar servicio</Button>
        </div>
      </ServiceDetailCard>
    );
  }
//pedido cancelado 
  if (request.status === "cancelled") {
    return (<ServiceDetailCard person={provider} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Cancelado" tone="muted" />}
      />
    );
  }

  //queda al pendiente de la respuesta del provider
  return (<ServiceDetailCard person={provider} request={request} imageUrl={imageUrl} badge={<StatusBadge label="En proceso..." tone="muted" />}>
      <p className="mt-5 text-center text-sm text-white/80">
        Esperando la respuesta de {providerName}. Te avisaremos cuando responda.
      </p>
    </ServiceDetailCard>
  );
}