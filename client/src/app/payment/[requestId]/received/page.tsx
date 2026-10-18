"use client";

import { use } from "react";
import { Avatar, NavBar, TopHeader } from "@/components/ui";
import { CURRENT_USER_ID, getPostById, getRequestById, getUserById } from "@/lib/mock";
import { formatPrice } from "../../formatPrice";
import { PaymentNotFound } from "../../PaymentNotFound";
import { PaymentResult } from "../../PaymentResult";

const PaymentReceivedScreen = ({ requestId }: { requestId: string }) => {
  const request = getRequestById(requestId);
  const post = request ? getPostById(request.post_id) : undefined;

  if (!request || !post || post.user_id !== CURRENT_USER_ID) return <PaymentNotFound />;

  const client = getUserById(request.client_id);
  const clientName = client?.name ?? "Usuario";

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios"/>

      <div className="flex flex-1 flex-col items-center px-4 pt-21">
        <PaymentResult title="Concluido su servicio!" message="Has concluido tu servicio con éxito!"/>

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
            <span className="font-bold text-truek-lime">Pagado:</span>
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