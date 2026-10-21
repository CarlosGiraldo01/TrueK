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

// "Solicitud de servicio": the detail the provider sees to accept or reject a request.
export function ProviderRequestView({ request, client, imageUrl }: Props) {
  const router = useRouter();
  const { acceptRequest, rejectRequest } = useRequests();

  if (request.status !== "pending") {
    const label = request.status === "rejected" ? "Rechazado" : "Cancelado";
    return (
      <ServiceDetailCard
        person={client}
        request={request}
        imageUrl={imageUrl}
        badge={<StatusBadge label={label} tone={request.status === "rejected" ? "orange" : "muted"} />}
      />
    );
  }

  const handleReject = () => {
    rejectRequest(request.id);
    // Back to Services, which is empty again.
    router.push("/requests");
  };

  return (
    <ServiceDetailCard person={client} request={request} imageUrl={imageUrl} badge={<StatusBadge label="Nueva" />}>
      <div className="mt-6 flex gap-4">
        {/* Accepting turns the screen into "Servicio activo". */}
        <Button onClick={() => acceptRequest(request.id)}>Aceptar</Button>
        <Button variant="accent" onClick={handleReject}>
          Rechazar
        </Button>
      </div>
    </ServiceDetailCard>
  );
}
