"use client";
// - "use" es como abrir una cajita de regalo que todavía viene cerrada.
// - "useState" es como una libreta mágica donde la página anota cosas y las recuerda.
import { use, useState } from "react";
import { useRouter } from "next/navigation";// "useRouter" es como un GPS: nos deja ir de una página a otra.
import { Button, Logo, NavBar, StarRating, TextField, TopHeader } from "@/components/ui";//los componenetes 
import { useRequests } from "../../../../context/RequestContext";// Traemos la "caja de juguetes compartida" donde se guardan todos los pedidos.
// Cualquier página puede abrir esta caja y ver o cambiar los pedidos.
import { getPostById, getUserById, type Rating } from "@/lib/mock";// Traemos funciones que buscan información de prueba:
// - getPostById: busca un anuncio por su número.
// - getUserById: busca a una persona por su número.
// - Rating: es la "forma" que tiene una calificación, como un molde de galletas.

const RatingScreen = ({ requestId }: { requestId: string }) => {
// Esta es la pantalla donde el cliente pone estrellitas y escribe qué le pareció el servicio.
// Recibe "requestId", que es el número del pedido que vamos a calificar.

// Abrimos la caja de pedidos y sacamos 4 herramientas:
  // - getRequest: busca un pedido.
  // - getRole: nos dice si soy el cliente o el que hizo el trabajo.
  // - addRating: guarda las estrellitas y el comentario.
  // - closeRequest: marca el pedido como terminado del todo
  const router = useRouter();
  const { getRequest, getRole, addRating, closeRequest } = useRequests();
  //estrellas
  const [stars, setStars] = useState(0);
  //cometario
  const [comment, setComment] = useState("");
//buscamos el pedido segun su numero
  const request = getRequest(requestId);
  //si no lo encontramos no hay nada y si si buscalo que va con el
  const post = request ? getPostById(request.post_id) : undefined;

 //condicion para que el cliente califique y solo cuando el servicio termina
 //se simula un error si esta mal o falta algo 
  if (!request || !post || getRole(request) !== "client" || request.status !== "finished") {
    return <p className="m-auto text-sm text-truek-placeholder">No hay un servicio para calificar</p>;}
//aqui se busca al man que hace el servicio (el dueno del anuncio)
  const provider = getUserById(post.user_id);
//esto hace que se guarden las estrellas y el cometario, si cerramos el pedido si ya lo leyo y la redireccion de la pagina de pago
  const handleSend = () => {addRating(request.id, stars as Rating["rating"], comment.trim()); closeRequest(request.id); router.push(`/payment/${request.id}`);};

  //esto retorna lo que se dibuja en pantalla
  return (//estilos
    <section className="rounded-3xl border border-truek-lime/50 bg-truek-card px-6 pb-8 pt-10">
      <div className="flex justify-center"><Logo variant="icon" height={44} /></div>
      <h2 className="mt-8 text-lg font-bold leading-snug text-white"> ¿Qué tal ha sido tu experiencia con {provider?.name ?? "el prestador"}?</h2>

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
//en esta funcion se hace lo de verla toda la pagina completa  se le pasan parametros 
export default function RatingPage({ params }: { params: Promise<{ requestId: string }> }) {
  // Abrimos la cajita con "use" y sacamos el número del pedido.
  const { requestId } = use(params);

  return (
    <div className="flex min-h-dvh flex-col"><TopHeader title="Servicios" /><main className="flex flex-1 flex-col px-5 pb-8 pt-8">
        <RatingScreen requestId={requestId} />
      </main>
      <NavBar activeId="servicios" />
    </div>
  );
}
