"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { Button, NavBar, TopHeader } from "@/components/ui";
import { useRequests } from "@/context/RequestContext";
import { useSession } from "@/context/SessionContext";
import { getPostById, getUserById } from "@/lib/mock";
import { RequestCard } from "../RequestCard";

// Services tab: it shows the CURRENT service of the logged user, not a list.
export default function RequestsPage() {
  const { user } = useSession();
  const router = useRouter();
  const { currentRequest, getRole, finishRequest } = useRequests();
  const post = currentRequest ? getPostById(currentRequest.post_id) : undefined;
  const role = currentRequest ? getRole(currentRequest) : null;

  // The chat bubble only appears when the service was accepted
  const showChat = currentRequest?.status === "accepted" || currentRequest?.status === "active";

  // The client finishes the service: first he rates it and then he pays
  const handleFinish = () => {
    if (!currentRequest) return;
    finishRequest(currentRequest.id);
    router.push(`/requests/${currentRequest.id}/rating`);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios" />

      <main className="flex-1 px-5 pt-6">
        {currentRequest && post && role ? (
          <>
            <RequestCard
              request={currentRequest}
              post={post}
              role={role}
              person={getUserById(role === "client" ? post.user_id : currentRequest.client_id)}
            />
            <p className="mt-4 text-center text-xs text-truek-placeholder">Toca la tarjeta para ver el detalle</p>

            {/* Only the client sees this button when the service was accepted */}
            {showChat && role === "client" && (
              <div className="mx-auto mt-8 w-full max-w-60">
                <Button onClick={handleFinish}>Finalizar</Button>
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

      {/* Chat bubble: it goes directly to the chat of the service */}
      {showChat && currentRequest && (
        <div className="pointer-events-none fixed inset-x-0 bottom-30 z-40 mx-auto flex w-full max-w-110 justify-end px-5">
          <Link
            href={`/chat/${currentRequest.id}`}
            aria-label="Abrir chat"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-truek-lime text-truek-black shadow-lg"
          >
            <ChatBubbleLeftEllipsisIcon className="size-8" strokeWidth={2} />
          </Link>
        </div>
      )}

      <NavBar activeId="servicios" />
    </div>
  );
}