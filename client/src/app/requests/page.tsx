"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { NavBar } from "@/components/ui/NavBar";
import { useSession } from "@/context/SessionContext";
import { SERVICE_REQUESTS, getUserById, getPostById } from "@/lib/mock";
import { formatPrice } from "@/app/payment/formatPrice";

export default function RequestsPage() {
  const router = useRouter();
  const { user, activeRole } = useSession();

  const isClient = activeRole === "client";

  // Filtrar solicitudes asociadas al usuario actual
  const userRequests = SERVICE_REQUESTS.filter((req) => {
    if (isClient) {
      return req.client_id === (user?.id ?? "u3") || req.client_id === "u1";
    } else {
      // Como proveedor: solicitudes dirigidas a los posts del proveedor
      const post = getPostById(req.post_id);
      return post?.user_id === (user?.id ?? "u2");
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <span className="rounded-full bg-[#D3FC31] px-2.5 py-0.5 text-[11px] font-bold text-black">Aceptado</span>;
      case "pending":
        return <span className="rounded-full bg-[#EAB308] px-2.5 py-0.5 text-[11px] font-bold text-black">Pendiente</span>;
      case "finished":
        return <span className="rounded-full bg-[#38BDF8] px-2.5 py-0.5 text-[11px] font-bold text-black">Finalizado</span>;
      case "rejected":
      case "cancelled":
        return <span className="rounded-full bg-[#EF4444] px-2.5 py-0.5 text-[11px] font-bold text-white">Cancelado</span>;
      default:
        return <span className="rounded-full bg-[#8A8A8A] px-2.5 py-0.5 text-[11px] font-bold text-black">{status}</span>;
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 flex size-10 items-center justify-center text-white transition-opacity active:opacity-60 cursor-pointer"
          aria-label="Volver"
        >
          <ChevronLeftIcon className="size-5" strokeWidth={2.5} />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Servicios y Trueks
        </h1>

        <div className="size-10" />
      </header>

      {/* Contenido de Servicios */}
      <main className="flex-1 px-4 py-4 pb-28">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            {isClient ? "Tus solicitudes contratadas" : "Solicitudes recibidas"}
          </h2>
          <span className="text-xs text-[#8A8A8A]">
            {userRequests.length} servicios
          </span>
        </div>

        {userRequests.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {userRequests.map((req) => {
              const post = getPostById(req.post_id);
              const otherUser = isClient
                ? (post ? getUserById(post.user_id) : null)
                : getUserById(req.client_id);

              return (
                <div
                  key={req.id}
                  className="rounded-[20px] border border-[#2E2E2E] bg-[#1B1B1B] p-4 text-white shadow-md transition-all hover:border-[#383838]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {post?.name ?? "Servicio TrueK"}
                      </h3>
                      <p className="text-xs text-[#8A8A8A]">
                        {isClient ? `Con ${otherUser?.name ?? "Proveedor"}` : `De ${otherUser?.name ?? "Cliente"}`}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-xs text-white/80 border-t border-[#242423] pt-2.5">
                    <p className="truncate">📍 {req.meeting_address}</p>
                    <p>📅 Fecha: {req.meeting_date} ({req.hours}h)</p>
                    <p className="font-semibold text-truek-lime">
                      Total: {formatPrice(req.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {req.status === "accepted" && !req.payment_confirmed && isClient && (
                      <button
                        type="button"
                        onClick={() => router.push(`/payment/${req.id}`)}
                        className="flex-1 rounded-xl bg-[#D3FC31] py-2 text-xs font-bold text-black hover:bg-[#cbf127] cursor-pointer"
                      >
                        Pagar servicio
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/chat/${req.id}`)}
                      className="flex-1 rounded-xl border border-[#383838] bg-black py-2 text-xs font-semibold text-white hover:border-[#555] cursor-pointer"
                    >
                      Abrir chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="my-10 flex flex-col items-center justify-center rounded-[20px] border border-[#2E2E2E] bg-[#1B1B1B] p-8 text-center">
            <h3 className="text-sm font-bold text-white">No tienes servicios activos</h3>
            <p className="mt-1 text-xs text-[#8A8A8A]">
              {isClient
                ? "Explora el feed y contrata una experiencia para comenzar."
                : "Aún no has recibido solicitudes en tus publicaciones."}
            </p>
          </div>
        )}
      </main>

      {/* Menú inferior con 'Servicios' activo */}
      <NavBar activeId="servicios" />
    </div>
  );
}
