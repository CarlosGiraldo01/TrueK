//la pantalla de “¡Listo!”.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, NavBar, TopHeader } from "@/components/ui";
import { ServiceBellIcon } from "@/components/icons/ServiceBellIcon";
import { useRequests } from "../../../../context/RequestContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import { PaymentResult } from "@/app/payment/PaymentResult";
import { ScheduleProgress } from "../../ScheduleProgress";
import { ServiceSummaryCard } from "../../ServiceSummaryCard";

export default function ServiceRequestedPage() {
  const router = useRouter();
  const { lastCreatedId, getRequest } = useRequests();
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();
  const request = lastCreatedId ? getRequest(lastCreatedId) : undefined;
  const post = request ? getPostById(request.post_id) : undefined;

  if (!request || !post) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopHeader title="Servicio pedido" onBack={() => router.push("/home")} />
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-10 text-center">
          <p className="text-sm text-truek-placeholder">Todavía no has pedido ningún servicio.</p>
          <Button onClick={() => router.push("/home")}>Ir al inicio</Button>
        </main>
        <NavBar activeId="inicio" />
      </div>
    );
  }

  const provider = getUserById(post.user_id);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Going back would repeat the request, so it goes to the Services tab instead. */}
      <TopHeader title="Servicio pedido" onBack={() => router.push("/requests")} />
      <ScheduleProgress step={3} />

      <main className="flex flex-1 flex-col px-5 pb-8 pt-12">
        <PaymentResult title="Pedido Exitoso!" message="Tu servicio ha sido pedido correctamente" />

        <div className="mt-10">
          <ServiceSummaryCard
            title="Servicio"
            imageUrl={request.request_image ?? post.post_image}
            providerName={provider?.name ?? "Prestador"}
            hours={request.hours}
            address={request.meeting_address}
          />
        </div>

        <div className="mt-auto pt-10">
          <Link
            href="/requests"
            className="flex items-center gap-3 rounded-2xl bg-truek-lime px-4 py-3 text-truek-black transition-transform active:scale-[0.98]"
          >
            <ServiceBellIcon className="size-6 shrink-0" strokeWidth={2} />
            <span className="flex-1 text-xs font-semibold leading-snug">
              Para más información de tu servicio dirígete a &ldquo;Servicios&rdquo;
            </span>
            <ChevronRightIcon className="size-5 shrink-0" strokeWidth={2.5} />
          </Link>
        </div>
      </main>

      <NavBar activeId="inicio" />
    </div>
  );
}
