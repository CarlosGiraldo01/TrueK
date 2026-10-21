"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, StarRating } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;// El pedido del servicio.
  client: User | undefined;
  imageUrl: string;
}

// "Servicio finalizado": esto es lo que ve el trabajador cuando ya terminó,
export function FinishedServiceView({ request, client, imageUrl }: Props) {
  const router = useRouter();//calificacion,cierra el pedido,simulacion de tiempo de espera 
  const { getRating, closeRequest, simulateClientRating } = useRequests();
  const rating = getRating(request.id);
  const hasRating = !!rating;//calificacion hecha por el clienet 
//se pregunta si ya hay calificacion
  // Simulation: a few seconds later the client sends the rating.
  useEffect(() => {
     // Si ya hay calificación, no hace falta hacer de cuenta. Nos salimos.
    if (hasRating) return;
    //simula un tiempo
    return simulateClientRating(request.id);
    //lo revisa 
  }, [hasRating, request.id, simulateClientRating]);
// Esto pasa cuando el trabajador aprieta el botón "Finalizar":
  const handleFinish = () => {
    closeRequest(request.id);
    router.push(`/payment/${request.id}/received`);
  };

  return (<ServiceDetailCard person={client} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Finalizado" />}>
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-white">Nivel de satisfacción:</h3>
        {rating ? (
          <StarRating value={rating.rating} size={22} />
        ) : (
          <p className="text-xs text-truek-placeholder">Esperando la calificación del cliente...</p>
        )}
      </div>

      {rating?.comment && (<div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-white">Comentarios</h3>
          <p className="rounded-xl bg-truek-field px-4 py-3 text-xs italic leading-relaxed text-white/80">
            &ldquo;{rating.comment}&rdquo;
          </p>
        </div>
      )}

      <div className="mx-auto mt-6 w-full max-w-60">
        <Button onClick={handleFinish}>Finalizar</Button>
      </div>
    </ServiceDetailCard>
  );
}
