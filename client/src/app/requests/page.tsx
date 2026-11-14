"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, NavBar, TopHeader } from "@/components/ui";
import { useRequests } from "@/context/RequestContext";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import { getErrorMessage } from "@/lib/errors";
import { RequestCard } from "./RequestCard";

// Pestaña de servicios muestra el servicio actual que está en curso
export default function RequestsPage() {
  const { user } = useSession();
  const router = useRouter();
  const { currentRequest, getRole, finishRequest } = useRequests();
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const post = currentRequest ? getPostById(currentRequest.post_id) : undefined;
  const role = currentRequest ? getRole(currentRequest) : null;

  // El botón del chat sale si el servicio ya fue aceptado o está activo
  const showChat = currentRequest?.status === "accepted" || currentRequest?.status === "active";

  // El cliente termina el servicio primero califica y después paga es la condicion para que parezca las pantallas
  const handleFinish = async () => {
    if (!currentRequest || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await finishRequest(currentRequest.id);
      router.push(`/requests/${currentRequest.id}/rating`);
    } catch (err) {
      setActionError(getErrorMessage(err, "No se pudo actualizar la solicitud. Intenta de nuevo."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios" />

      <main className="flex-1 px-5 pt-6">
        {currentRequest && post && role ? (
          <> <RequestCard
              request={currentRequest}
              post={post}
              role={role}
              person={getUserById(role === "client" ? post.user_id : currentRequest.client_id)}/>
            <p className="mt-4 text-center text-xs text-truek-placeholder">
              Toca la tarjeta para ver el detalle
            </p>

            {/* Si es cliente y ya le aceptaron el servicio, puede finalizarlo */}
            {showChat && role === "client" && (
              <div className="mx-auto mt-8 w-full max-w-60">
                <Button onClick={handleFinish} disabled={isSubmitting}>Finalizar</Button>
                {actionError && (
                  <p role="alert" className="mt-3 text-center text-sm text-truek-orange">{actionError}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <p className="text-sm font-semibold text-white">No tienes servicios</p>
            {user?.role !== "provider" && (
              <Link href="/search" className="border-b-2 border-truek-lime pb-0.5 text-sm font-bold text-truek-lime">
                Buscar servicios
              </Link>
            )}
          </div>
        )}
      </main>


      <NavBar activeId="servicios" />
    </div>
  );
}