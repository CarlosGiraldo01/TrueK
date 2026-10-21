"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
//requestrole es el que define el rol de la persona 
import { useRequests, type RequestRole } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
//se trae la trajeta que muestralos datos del servicio
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";
//lista de lo que necesitamos
interface Props {
  request: ServiceRequest;// El pedido del servicio.
  person: User | undefined; // La otra persona: si eres el cliente, ves al que trabaja;
  role: RequestRole;// Quién eres tú: "client" (cliente) o el que hace el trabajo.
  imageUrl: string;// La dirección de la foto que se va a mostrar.
}

// "Servicio activo": significa que el trabajo está pasando ahora mismo.
// Los dos ven la misma tarjeta, pero cada uno tiene cosas distintas para hacer.
export function ActiveServiceView({ request, person, role, imageUrl }: Props) {
  const { finishRequest, simulateProviderFinish } = useRequests();
  // Abrimos la caja de pedidos y sacamos 2 herramientas:
  // - finishRequest: marca el servicio como terminado.
  // - simulateProviderFinish: hace de cuenta que el trabajador termina solito después de un ratito.
  const isClient = role === "client";//cliente si o no 

  //vizualizacion del cliente  de la terminacion de su servicio
  useEffect(() => {
    if (!isClient) return;
    return simulateProviderFinish(request.id);
  }, [isClient, request.id, simulateProviderFinish]);
 // Aquí dibujamos lo que se ve en la pantalla:
  return (
    <ServiceDetailCard person={person} request={request} imageUrl={imageUrl} badge={<StatusBadge label={request.status === "accepted" && isClient ? "Aceptado" : "Activo"} />}>
      {isClient ? (
        <p className="mt-5 text-center text-xs text-white/70">
          Cuando {person?.name ?? "el prestador"} dé por finalizado el servicio, te avisaremos para calificarlo.</p>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-60">
          {/* The screen turns into "Servicio finalizado". */}
          <Button onClick={() => finishRequest(request.id)}>Dar por finalizado</Button>
        </div>
      )}
    </ServiceDetailCard>
  );
}