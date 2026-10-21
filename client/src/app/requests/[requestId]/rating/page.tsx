"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";// "useRouter" es como un GPS: nos deja ir de una página a otra.
import { Button, Logo, NavBar, StarRating, TextField, TopHeader } from "@/components/ui";//los componenetes 
import { useRequests } from "../../../../context/RequestContext";//
import { getPostById, getUserById, type Rating } from "@/lib/mock";

const RatingScreen = ({ requestId }: { requestId: string }) => {
  const router = useRouter();
  const { getRequest, getRole, addRating, closeRequest } = useRequests();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const request = getRequest(requestId);
  const post = request ? getPostById(request.post_id) : undefined;

  // Only the client of a finished service can rate it.
  if (!request || !post || getRole(request) !== "client" || request.status !== "finished") {
    return <p className="m-auto text-sm text-truek-placeholder">No hay un servicio para calificar</p>;
  }

  const provider = getUserById(post.user_id);

  const handleSend = () => {
    addRating(request.id, stars as Rating["rating"], comment.trim());
    closeRequest(request.id);
    router.push(`/payment/${request.id}`);
  };

  return (
    <section className="rounded-3xl border border-truek-lime/50 bg-truek-card px-6 pb-8 pt-10">
      <div className="flex justify-center">
        <Logo variant="icon" height={44} />
      </div>
      <h2 className="mt-8 text-lg font-bold leading-snug text-white">
        ¿Qué tal ha sido tu experiencia con {provider?.name ?? "el prestador"}?
      </h2>

      <p className="mb-2 mt-6 text-sm text-white">Nivel de satisfacción</p>
      <div className="flex h-11 items-center rounded-xl bg-truek-field px-3.5">
        <StarRating value={stars} onChange={setStars} size={26} />
      </div>

      <TextField
        multiline
        label="Déjanos tu comentario"
        placeholder="Escribe aquí tu comentario..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mt-5"
      />

      <div className="mx-auto mt-8 w-full max-w-60">
        <Button onClick={handleSend} disabled={stars === 0}>
          Enviar
        </Button>
      </div>
    </section>
  );
};

export default function RatingPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopHeader title="Servicios" />
      <main className="flex flex-1 flex-col px-5 pb-8 pt-8">
        <RatingScreen requestId={requestId} />
      </main>
      <NavBar activeId="servicios" />
    </div>
  );
}
