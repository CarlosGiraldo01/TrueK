import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/lib/mock";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;
  client: User | undefined;
  imageUrl: string;
}
// "Solicitud de servicio": esto es lo que ve el trabajador cuando le llega un pedido nuevo.
export function ProviderRequestView({ request, client, imageUrl }: Props) {
  const router = useRouter();// - acceptRequest: dice "¡sí, acepto el trabajo!".
  // - rejectRequest: dice "no, no puedo hacerlo".
  const { acceptRequest, rejectRequest } = useRequests();

  if (request.status !== "pending") {const label = request.status === "rejected" ? "Rechazado" : "Cancelado";
    return (
      <ServiceDetailCard person={client} request={request} imageUrl={imageUrl}badge={<StatusBadge label={label} tone={request.status === "rejected" ? "orange" : "muted"} />}
      />
    );
  }
 // Esto pasa cuando el trabajador aprieta el botón "Rechazar":
  const handleReject = () => {
    //se marca como rechazado
    rejectRequest(request.id);
    //ubicador de devuleta vacio
    router.push("/requests");
  };
// Si llegamos hasta aquí, es porque el pedido es nuevo y está esperando respuesta.
  return (<ServiceDetailCard person={client} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Nueva" />}>
      <div className="mt-6 flex gap-4">
        {/* "Servicio activo". */}
        <Button onClick={() => acceptRequest(request.id)}>Aceptar</Button>
        <Button variant="accent" onClick={handleReject}>
          Rechazar
        </Button>
      </div>
    </ServiceDetailCard>
  );
}
