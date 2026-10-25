//paso 2: el archivo que acabamos de comentar, donde se revisa todo y se confirma.
"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import { Button, NavBar, TopHeader } from "@/components/ui";
import { useRequests } from "../../../../context/RequestContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import { formatPrice } from "@/app/payment/formatPrice";
import { formatDate, formatHours, formatTime } from "../../../requests/formatService";
import { ScheduleProgress } from "../../ScheduleProgress";
import { ServiceSummaryCard } from "../../ServiceSummaryCard";


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-white/70">{label} :</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

const ConfirmScreen = ({ postId }: { postId: string }) => {
  const router = useRouter();
  const requests = useRequests() as ReturnType<typeof useRequests> & {
    quote: { price_per_hour: number; total: number } | null;
    quoteLoading: boolean;
    quoteError: string | null;
  };
  const { draft, createRequest, quote, quoteLoading, quoteError } = requests;
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();
  const post = getPostById(postId);

  if (!post) notFound();

  // Opened directly without filling the form first.
  if (!draft || draft.post_id !== postId) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopHeader title="Confirmar servicio" />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-10 text-center">
          <p className="text-sm text-truek-placeholder">Primero completa los datos del servicio.</p>
          <Button onClick={() => router.replace(`/schedule/${postId}`)}>Agendar servicio</Button>
        </main>
        <NavBar activeId="inicio" />
      </div>
    );
  }

  // El precio lo calcula el servidor (GET /requests/quote) cuando se guarda el formulario.
  if (quoteLoading || !quote) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopHeader title="Confirmar servicio" />
        <main className="flex flex-1 items-center justify-center px-10 text-center">
          <p className="text-sm text-truek-placeholder">{quoteError ?? "Calculando el precio..."}</p>
        </main>
        <NavBar activeId="inicio" />
      </div>
    );
  }

  const provider = getUserById(post.user_id);
  const pricePerHour = quote.price_per_hour;
  const total = quote.total;

  const handleConfirm = () => {
    const request = createRequest();
    if (request) router.replace(`/schedule/${postId}/success`);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Confirmar servicio" />
      <ScheduleProgress step={2} />

      <main className="flex-1 space-y-5 px-5 pb-8 pt-6">
        <ServiceSummaryCard
          title="Resumen del servicio"
          imageUrl={draft.request_image ?? post.post_image}
          providerName={provider?.name ?? "Prestador"}
          hours={draft.hours}
          pricePerHour={pricePerHour}
        />

        <section className="rounded-2xl border border-truek-line bg-truek-surface p-5">
          <h2 className="mb-4 text-base font-bold text-white">Datos del servicio</h2>
          <div className="space-y-3 text-sm">
            <Row label="Cliente" value={draft.client_name} />
            <Row label="Dirección" value={draft.meeting_address} />
            <Row label="Fecha" value={formatDate(draft.date)} />
            <Row label="Hora" value={formatTime(draft.time)} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-truek-lime/60 bg-truek-surface">
          <div className="p-5">
            <h2 className="mb-4 text-base font-bold text-white">Resumen de pago</h2>
            <div className="space-y-3 text-sm">
              <Row label="Duración" value={formatHours(draft.hours)} />
              <Row label="Subtotal" value={formatPrice(total)} />
            </div>
          </div>
          <div className="flex items-center justify-between bg-truek-lime/30 px-5 py-3 text-base">
            <span className="font-bold text-truek-lime">Total :</span>
            <span className="font-semibold text-white">{formatPrice(total)}</span>
          </div>
        </section>

        <div className="px-12 pt-2">
          <Button onClick={handleConfirm}>Confirmar</Button>
        </div>
      </main>

      <NavBar activeId="inicio" />
    </div>
  );
};

export default function ConfirmServicePage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);

  return <ConfirmScreen postId={postId} />;
}
