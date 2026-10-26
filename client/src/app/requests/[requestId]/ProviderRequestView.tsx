import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useRequests } from "../../../context/RequestContext";
import type { ServiceRequest, User } from "@/types";
import { ServiceDetailCard, StatusBadge } from "./ServiceDetailCard";

interface Props {
  request: ServiceRequest;
  client: User | undefined;
  imageUrl: string;
}
// "Solicitud de servicio esto es lo que ve el trabajador cuando le llega un pedido nuevo.
export function ProviderRequestView({ request, client, imageUrl }: Props) {
  const router = useRouter();// si accepta el trabajo dice que si.
 //y si lo rechaza dice que no y rejectRequet
  const { acceptRequest, rejectRequest } = useRequests();

  if (request.status !== "pending") {const label = request.status === "rejected" ? "Rechazado" : "Cancelado";
    return (
      <ServiceDetailCard person={client} request={request} imageUrl={imageUrl}badge={<StatusBadge label={label} tone={request.status === "rejected" ? "orange" : "muted"} />}/>);
  }
 //lo que sucede aqui es la parte de rechar si el provider rechaza
      const handleReject = async () => {await rejectRequest(request.id);
      router.push("/requests");
      };
// esto lo que hace es esperar la respuesta 
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

