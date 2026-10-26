"use client";

import { use } from "react";
import { NavBar, TopHeader } from "@/components/ui";
import { useRequests } from "@/context/RequestContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import { ActiveServiceView } from "./ActiveServiceView";
import { ClientRequestView } from "./ClientRequetView";
import { FinishedServiceView } from "./FinishedServiceview";
import { ProviderRequestView } from "./ProviderRequestView";
//pagina padre donde decide que mostrar
const RequestDetail = ({ requestId }: { requestId: string }) => {
  const { getRequest, getRole } = useRequests();
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();
  const request = getRequest(requestId);
  const post = request ? getPostById(request.post_id) : undefined;
  // recopilar la información de las solicitudes, los usuarios y las publicaciones
  const role = request ? getRole(request) : null;

  if (!request || !post || !role) {
    return <p className="m-auto text-sm text-truek-placeholder">No encontramos este servicio</p>;
  }

  const imageUrl = request.request_image ?? post.post_image;

  if (role === "client") {
    const provider = getUserById(post.user_id);
    if (request.status === "accepted" || request.status === "active") {
      return <ActiveServiceView request={request} person={provider} role="client" imageUrl={imageUrl} />;
    }
    return <ClientRequestView request={request} provider={provider} imageUrl={imageUrl} />;
  }

  const client = getUserById(request.client_id);
  switch (request.status) {case "accepted": case "active":return <ActiveServiceView request={request} person={client} role="provider" imageUrl={imageUrl} />;
    case "finished":return <FinishedServiceView request={request} client={client} imageUrl={imageUrl} />;
    default:return <ProviderRequestView request={request} client={client} imageUrl={imageUrl} />;
  }
};

export default function RequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios" />
      <main className="flex flex-1 flex-col px-5 pb-8 pt-6">
        <RequestDetail requestId={requestId} />
      </main>
      <NavBar activeId="servicios" />
    </div>
  );
}
