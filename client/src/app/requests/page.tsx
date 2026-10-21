"use client";

import Link from "next/link";
import { NavBar, TopHeader } from "@/components/ui";
import { useRequests } from "../../context/RequestContext";
import { useSession } from "@/context/SessionContext";
import { getPostById, getUserById } from "@/lib/mock";
import { RequestCard } from "./RequestCard";

// Services tab: it shows the CURRENT service of the logged user, not a list.
export default function RequestsPage() {
  const { user } = useSession();
  const { currentRequest, getRole } = useRequests();
  const post = currentRequest ? getPostById(currentRequest.post_id) : undefined;
  const role = currentRequest ? getRole(currentRequest) : null;

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

