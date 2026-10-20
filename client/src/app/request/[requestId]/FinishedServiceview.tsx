"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, StarRating } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;
  client: User | undefined;
  imageUrl: string;
}

// "Servicio finalizado": what the provider sees after finishing, with the client's rating.
export function FinishedServiceView({ request, client, imageUrl }: Props) {
  const router = useRouter();
  const { getRating, closeRequest, simulateClientRating } = useRequests();
  const rating = getRating(request.id);
  const hasRating = !!rating;

  // Simulation: a few seconds later the client sends the rating.
  useEffect(() => {
    if (hasRating) return;
    return simulateClientRating(request.id);
  }, [hasRating, request.id, simulateClientRating]);

  const handleFinish = () => {
    closeRequest(request.id);
    router.push(`/payment/${request.id}/received`);
  };

  return (
    <ServiceDetailCard person={client} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Finalizado" />}>
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-white">Nivel de satisfacción:</h3>
        {rating ? (
          <StarRating value={rating.rating} size={22} />
        ) : (
          <p className="text-xs text-truek-placeholder">Esperando la calificación del cliente...</p>
        )}
      </div>

      {rating?.comment && (
        <div className="mt-5">
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
