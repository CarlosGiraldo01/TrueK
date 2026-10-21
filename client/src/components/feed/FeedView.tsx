"use client";

import { useRouter } from "next/navigation";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { PostCard } from "@/components/ui/PostCard";
import { NavBar } from "@/components/ui/NavBar";
import { getUserRating, type UserRole } from "@/lib/mock";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";

interface FeedViewProps {
  /**
   * Rol forzado para la vista (?til para rutas fijas como /feed/provider y /feed/client).
   * Si no se especifica, toma el rol activo actual de la sesión.
   */
  forcedRole?: UserRole;
}

export function FeedView({ forcedRole }: FeedViewProps) {
  const router = useRouter();
  const { activeRole, setActiveRole } = useSession();
  const { posts } = usePosts();

  // Rol efectivo a renderizar
  const currentRole: UserRole = forcedRole ?? activeRole;
  const isProvider = currentRole === "provider";

  const handleCreatePost = () => {
    if (activeRole !== "provider") {
      setActiveRole("provider");
    }
    router.push("/feed/create");
  };

  const handleSeeMore = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      {/* 
        =======================================================================
        BARRA SUPERIOR (HEADER): LÓGICA DE VISIBILIDAD CONDICIONAL SEGÚN ROL
        =======================================================================
        - Rol Proveedor: Se renderiza el botón de acción (+) en la esquina superior derecha.
        - Rol Cliente: El botón (+) se destruye/omite totalmente del árbol DOM.
      */}
      <FeedHeader
        role={currentRole}
        onCreatePost={isProvider ? handleCreatePost : undefined}
      />

      {/* 
        =======================================================================
        FEED PRINCIPAL: LISTADO DE PUBLICACIONES / EXPERIENCIAS
        =======================================================================
      */}
      <main className="flex-1 px-4 py-4 pb-28">
        <div className="flex flex-col gap-5">
          {posts.map((post) => {
            const rating = post.rating ?? getUserRating(post.user_id) ?? 5;

            return (
              <PostCard
                key={post.id}
                imageUrl={post.post_image}
                name={post.name}
                about={post.description}
                tags={post.tags}
                location={post.location}
                rating={rating}
                seeMoreLabel="Ver más"
                onSeeMore={() => handleSeeMore(post.id)}
              />
            );
          })}
        </div>
      </main>

      {/* 
        =======================================================================
        BADGE FLOTANTE DE CONTROL / CAMBIO RÁPIDO DE ROL
        =======================================================================
      */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            const nextRole = isProvider ? "client" : "provider";
            setActiveRole(nextRole);
            router.push(nextRole === "provider" ? "/feed/provider" : "/feed/client");
          }}
          className="flex items-center gap-2 rounded-full border border-[#3A3A39] bg-[#1F1F1E]/95 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:border-[#D3FC31] hover:scale-105 active:scale-95 cursor-pointer"
          title="Alternar entre rol Proveedor y Cliente para pruebas"
          aria-label="Alternar rol activo"
        >
          <span
            className={`size-2 rounded-full ${
              isProvider ? "bg-[#D3FC31] animate-pulse" : "bg-[#38BDF8]"
            }`}
          />
          <span>
            Rol: <strong className="text-white">{isProvider ? "Proveedor" : "Cliente"}</strong>
          </span>
          <span className="text-[10px] text-[#8A8A8A] underline">
            {isProvider ? "Ver como Cliente" : "Ver como Proveedor"}
          </span>
        </button>
      </div>

      {/* 
        =======================================================================
        MENÚ DE NAVEGACIÓN INFERIOR (COMÚN A CLIENTE Y PROVEEDOR)
        =======================================================================
      */}
      <NavBar activeId="inicio" />
    </div>
  );
}
