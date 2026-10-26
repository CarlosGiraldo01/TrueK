"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useRequests, type RequestRole } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/types";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";
interface Props {
  request: ServiceRequest;
  person: User | undefined; 
  role: RequestRole;
  imageUrl: string;
}

//en esta pagina lo que sucede es la vista de que el servico esta activo
// Los dos ven la misma tarjeta, pero cada uno tiene cosas distintas para hacer.
export function ActiveServiceView({ request, person, role, imageUrl }: Props) {
  const router = useRouter();
  //el requerimiento final pregunta si ya se puede cambiar 
  const { finishRequest } = useRequests();
  const isClient = role === "client";//cliente si o no 

 // Aquí dibujamos lo que se ve en la pantalla:
  return (
    <ServiceDetailCard person={person} request={request} imageUrl={imageUrl} badge={<StatusBadge label={request.status === "accepted" && isClient ? "Aceptado" : "Activo"} />}>
      <div className="mx-auto mt-6 w-full max-w-60">
        <Button variant="accent" onClick={() => router.push(`/chat/${request.id}`)}>Abrir chat</Button>
      </div>
      {isClient ? (
        <p className="mt-5 text-center text-xs text-white/70">
          Cuando {person?.name ?? "el prestador"} dé por finalizado el servicio, te avisaremos para calificarlo.</p>
      ) : (
        <div className="mx-auto mt-6 w-full max-w-60">
          {/*pantallade finalizar*/}
          <Button onClick={() => finishRequest(request.id)}>Dar por finalizado</Button>
        </div>
      )}
    </ServiceDetailCard>
  );
}