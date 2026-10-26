"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { StarRating } from "@/components/ui/StarRating";
import { NavBar } from "@/components/ui/NavBar";
import { usePosts } from "@/context/PostsContext";
import { useSession } from "@/context/SessionContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { getPostById } = usePosts();
  const { activeRole } = useSession();

  const post = getPostById(id);
  const isClient = activeRole === "client";
  const justCreated = searchParams.get("created") === "true";

  if (!post) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#161615] px-6 text-center text-white">
        <h2 className="text-xl font-bold">Publicación no encontrada</h2>
        <p className="mt-2 text-sm text-[#8A8A8A]">
          La publicación que buscas no existe o fue eliminada.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 rounded-xl bg-[#D3FC31] px-5 py-2.5 text-sm font-bold text-black cursor-pointer"
        >
          Volver
        </button>
      </div>
    );
  }

  // Si lo acabamos de crear nos manda al perfil, si no pues a la página anterior
  const handleBack = () => {
    if (justCreated) {
      router.push("/profile");
    } else {
      router.back();
    }
  };

  const handleHireService = () => {
    router.push("/schedule/" + post.id);
  };

  // Lógica de precio más natural y limpia
  const formattedPrice = typeof post.price === "number"
    ? `$${post.price.toLocaleString("es-CO")}/h`
    : `${post.price || "$5.000"}/h`;

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      
      {/* Header simple */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-2 flex size-10 items-center justify-center text-white transition-opacity active:opacity-60 cursor-pointer"
          aria-label="Volver"
        >
          <ChevronLeftIcon className="size-5" strokeWidth={2.5} />
        </button>

        <h1 className="text-base font-bold text-white tracking-wide">
          Publicación
        </h1>

        <div className="size-10" />
      </header>

      {/* Contenido del detalle */}
      <main className="flex-1 px-5 py-5 pb-28">
        <article className="flex flex-col gap-4">
          
          {/* Fotito principal */}
          <div className="aspect-[16/11] w-full overflow-hidden rounded-[22px] bg-black shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.post_image}
              alt={post.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="flex items-baseline justify-between gap-2 pt-1">
            <h2 className="text-xl font-bold text-white">{post.name}</h2>
            {post.published_ago && (
              <span className="shrink-0 text-xs text-[#8A8A8A]">
                {post.published_ago}
              </span>
            )}
          </div>
          {post.age && (
            <p className="-mt-3 text-xs font-semibold text-white/70">{post.age}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#383838] bg-black px-3.5 py-1 text-xs text-white"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Rating y ubicación */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-2">
              <StarRating value={post.rating ?? 4.7} size={16} />
              <span className="text-xs font-semibold text-white/80">
                {(post.rating ?? 4.7).toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-[#8A8A8A]">{post.location}</p>
          </div>

          {/* Sobre mí */}
          <section className="flex flex-col gap-1 border-t border-[#242423] pt-3">
            <h3 className="text-sm font-bold text-white">Sobre mí</h3>
            <p className="text-xs leading-relaxed text-white/80">
              {post.description}
            </p>
          </section>

          {/* Qué ofrezco */}
          {post.offer && (
            <section className="flex flex-col gap-1 border-t border-[#242423] pt-3">
              <h3 className="text-sm font-bold text-white">Qué ofrezco</h3>
              <p className="text-xs leading-relaxed text-white/80">
                {post.offer}
              </p>
            </section>
          )}

          {/* Costo */}
          <section className="flex flex-col gap-1 border-t border-[#242423] pt-3">
            <h3 className="text-sm font-bold text-white">Costo</h3>
            <p className="text-sm font-bold text-truek-lime">
              {formattedPrice}
            </p>
          </section>

          {/* Botón de contratar (solo si es cliente) */}
          {isClient && (
            <div className="mt-3 pt-2">
              <button
                type="button"
                onClick={handleHireService}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-[14px] bg-[#D3FC31] text-base font-bold text-black shadow-lg transition-transform hover:bg-[#cbf127] active:scale-95"
              >
                Contratar servicio
              </button>
            </div>
          )}
        </article>
      </main>

      <NavBar activeId="inicio" />
    </div>
  );
}