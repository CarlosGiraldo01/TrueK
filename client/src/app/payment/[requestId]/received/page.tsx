"use client";

import { useSession } from "@/context/SessionContext";
import { use } from "react";
import { Avatar, NavBar, TopHeader } from "@/components/ui";
import { usePosts } from "@/context/PostsContext";
import { useRequests } from "@/context/RequestContext";
import { useUsers } from "@/context/UsersContext";
import { formatPrice } from "../../formatPrice";
import { PaymentNotFound } from "../../PaymentNotFound";
import { PaymentResult } from "../../PaymentResult";

const PaymentReceivedScreen = ({ requestId }: { requestId: string }) => {
  // The logged user comes from the session (not a fixed id)
  const currentUserId = useSession().user?.id;
  const { getPostById } = usePosts();
  const { getRequest } = useRequests();
  const { getUserById } = useUsers();
  const request = getRequest(requestId);
  const post = request ? getPostById(request.post_id) : undefined;

  if (!request || !post || post.user_id !== currentUserId) return <PaymentNotFound />;

  const client = getUserById(request.client_id);
  const clientName = client?.name ?? "Usuario";
  // Cambia solo cuando el cliente paga (llega por el socket)
  const isPaid = request.payment_confirmed;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios"/>

      <div className="flex flex-1 flex-col items-center px-4 pt-21">
        {isPaid ? (
          <PaymentResult title="Concluido su servicio!" message="Has concluido tu servicio con éxito!"/>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="size-32 animate-pulse rounded-full border-[2.5px] border-truek-line" />
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">Esperando el pago</h1>
            <p className="mt-6 max-w-65 text-base leading-snug text-white">
              {clientName} aún no ha pagado. Esta pantalla se actualiza sola cuando pague.
            </p>
          </div>
        )}

        <div className="mt-7 w-full overflow-hidden rounded-2xl border border-truek-lime pb-5">
          <div className="px-5 pt-5">
            <div className="flex items-start gap-4">
              <Avatar src={client?.profile_picture ??  undefined} name={clientName} size="lg"/>
              <span className="mt-4 text-xl font-semibold text-white">{clientName}</span>
            </div>

            <h2 className="mb-4 mt-10 text-base font-semibold text-white">Resumen de pago</h2>
            <div className="space-y-3 pb-4 text-base text-white/70">
            <div className="flex items-center justify-between">
                <span>Duración :</span>
                <span className="text-white"> {request.hours} {request.hours === 1 ? "Hora" : "Horas"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal :</span>
                <span className="text-white">{formatPrice(request.price)}</span>
                </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-truek-lime/30 px-7 py-3 text-lg">
            <span className="font-bold text-truek-lime">{isPaid ? "Pagado:" : "Pendiente:"}</span>
            <span className="text-white">{formatPrice(request.price)}</span>
          </div>
        </div>
      </div>

      <NavBar activeId="servicios"/>
    </div>
  );
};

export default function PaymentReceivedPage({  params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return <PaymentReceivedScreen requestId={requestId}/>;
}