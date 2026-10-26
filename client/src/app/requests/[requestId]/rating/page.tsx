"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Logo, NavBar, StarRating, TextField, TopHeader } from "@/components/ui";
import { useRequests } from "../../../../context/RequestContext";
import { usePosts } from "@/context/PostsContext";
import { useUsers } from "@/context/UsersContext";
import type { Rating } from "@/types";

const RatingScreen = ({ requestId }: { requestId: string }) => {
// Esta es la pantalla donde el cliente pone estrellitas y escribe qué le pareció el servicio.

  const router = useRouter();
  const { getRequest, getRole, addRating, closeRequest } = useRequests();
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const request = getRequest(requestId);
  const post = request ? getPostById(request.post_id) : undefined;

 //condicion para que el cliente califique y solo cuando el servicio termina
 //se simula un error si esta mal o falta algo 
  if (!request || !post || getRole(request) !== "client" || request.status !== "finished") {
    return <p className="m-auto text-sm text-truek-placeholder">No hay un servicio para calificar</p>;}
  const provider = getUserById(post.user_id);
//esto hace que se guarden las estrellas y el cometario, si cerramos el pedido si ya lo leyo y la redireccion de la pagina de pago
  const handleSend = () => {addRating(request.id, stars as Rating["rating"], comment.trim()); closeRequest(request.id); router.push(`/payment/${request.id}`);};

  //esto retorna lo que se dibuja en pantalla
  return (//estilos
    <section className="rounded-3xl border border-truek-lime/50 bg-truek-card px-6 pb-8 pt-10">
      <div className="flex justify-center"><Logo variant="icon" height={44} /></div>
      <h2 className="mt-8 text-lg font-bold leading-snug text-white"> ¿Qué tal ha sido tu experiencia con {provider?.name ?? "el prestador"}?</h2>

      <p className="mb-2 mt-6 text-sm text-white">Nivel de satisfacción</p>
      <div className="flex h-11 items-center rounded-xl border border-truek-line bg-truek-black px-3.5">
        <StarRating value={stars} onChange={setStars} size={26} />
      </div>

      <TextField multiline label="Déjanos tu comentario" placeholder="Escribe aquí tu comentario..." value={comment} onChange={(e) => setComment(e.target.value)}className="mt-5"/>

      <div className="mx-auto mt-8 w-full max-w-60">
        <Button onClick={handleSend} disabled={stars === 0}>
          Enviar
        </Button>
      </div>
    </section>
  );
};
//en esta funcion se hace lo de verla toda la pagina completa  se le pasan parametros 
export default function RatingPage({ params }: { params: Promise<{ requestId: string }> }) {
  
  const { requestId } = use(params);

  return (
    <div className="flex min-h-dvh flex-col"><TopHeader title="Servicios" /><main className="flex flex-1 flex-col px-5 pb-8 pt-8">
        <RatingScreen requestId={requestId} />
      </main>
      <NavBar activeId="servicios" />
    </div>
  );
}