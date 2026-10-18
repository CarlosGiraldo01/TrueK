"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronRightIcon, PencilIcon } from "@heroicons/react/24/solid";
import { NavBar, TopHeader } from "@/components/ui";
import { CURRENT_USER_ID, getRequestById } from "@/lib/mock";
import { formatPrice } from "../formatPrice";
import { PaymentNotFound } from "../PaymentNotFound";
import { SwipeToPay } from "./SwipeToPay";

const PaymentScreen = ({ requestId } : { requestId: string }) => {
  const router = useRouter();
  const request = getRequestById(requestId);
  const [price, setPrice] = useState(request?.price ?? 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (!request || request.client_id !== CURRENT_USER_ID) return <PaymentNotFound />;

  const startEditing = () => {
    setDraft(String(price));
    setEditing(true);
  };

  const confirmEditing = () => {
    const value = Number(draft);
    if (value > 0) setPrice(value);
    setEditing(false);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Pago"/>

      <div className="flex-1 px-5 pt-10">
        <div className="rounded-3xl border border-truek-field bg-truek-surface">
            <div className="px-6 pb-7 pt-8 text-center">
                <p className="text-xl font-medium text-white">Total a pagar</p>
                <div className="mt-5 flex items-center justify-center gap-3 text-5xl font-extrabold tracking-tight text-truek-lime">
                    {editing ? (
                        <>
                  <span>$</span>
                  <input autoFocus inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && confirmEditing()}
                    className="w-44 border-b-2 border-truek-lime bg-transparent text-center focus:outline-none"/>
                </>
              ) : (
                <span>{formatPrice(price)}</span>
              )}
              <button
                type="button"
                onClick={editing ? confirmEditing : startEditing}
                aria-label={editing ? "Confirmar monto" : "Editar monto"}
                className="p-1 transition-opacity active:opacity-60 focus:outline-none"
              >
                {editing ? <CheckIcon className="size-7" /> : <PencilIcon className="size-6"/>}
              </button>
            </div>
          </div>

          <div className="h-px bg-truek-line" />

          <div className="px-6 pb-12 pt-8">
            <h3 className="mb-4 text-base font-semibold text-white">Método de pago</h3>
        <div className="flex items-center justify-between rounded-2xl bg-truek-line p-4">
            <div className="flex items-center gap-4">
            <div className="flex h-10 w-15 flex-col justify-between rounded-md bg-white p-1.5">
                <div className="h-1 w-7 rounded-full bg-truek-placeholder" />
                <div className="self-end text-[8px] font-bold leading-none text-truek-placeholder">VISA</div>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-white">**** 4582</div>
                  <div className="text-xl font-medium text-white">VISA</div>
                </div>
              </div>
              <ChevronRightIcon className="size-5 text-white" />
            </div>

            <h3 className="mb-4 mt-9 text-base font-semibold text-white">Resumen</h3>
            <div className="flex items-center justify-between text-base">
              <span className="text-white/70">Servicio</span>
              <span className="text-white">{formatPrice(price)}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 px-3">
          <SwipeToPay onComplete={() => router.replace(`/payment/${requestId}/success`)}/>
        </div>
      </div>

      <NavBar activeId="servicios"/>
    </div>
  );
};

export default function PaymentPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return <PaymentScreen requestId={requestId}/>;
}