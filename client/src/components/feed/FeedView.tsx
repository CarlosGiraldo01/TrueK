"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { PostCard } from "@/components/ui/PostCard";
import { NavBar } from "@/components/ui/NavBar";
import { POSTS, getUserRating, getUserById, type UserRole, type Post } from "@/lib/mock";
import { useSession } from "@/context/SessionContext";

interface FeedViewProps {
  /**
   * Rol forzado para la vista (útil para rutas estáticas como /feed/provider y /feed/client).
   * Si no se especifica, toma el rol activo actual de la sesión.
   */
  forcedRole?: UserRole;
}

export function FeedView({ forcedRole }: FeedViewProps) {
  const router = useRouter();
  const { activeRole, switchRole } = useSession();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Rol efectivo a renderizar
  const currentRole: UserRole = forcedRole ?? activeRole;
  const isProvider = currentRole === "provider";

  const handleCreatePost = () => {
    // Redirección al formulario de creación exclusiva para proveedores
    router.push("/feed/create");
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
        Mantiene intacto el diseño y visualización de tarjetas tanto para Cliente
        como para Proveedor.
      */}
      <main className="flex-1 px-4 py-4 pb-28">
        <div className="flex flex-col gap-5">
          {POSTS.map((post) => {
            const rating = getUserRating(post.user_id) || 5;

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
                onSeeMore={() => setSelectedPost(post)}
              />
            );
          })}
        </div>
      </main>

      {/* 
        =======================================================================
        BADGE FLOTANTE DE CONTROL / CAMBIO RÁPIDO DE ROL (DESARROLLO Y TESTING)
        =======================================================================
        Permite conmutar interactivamente entre rol Cliente y rol Proveedor
        para verificar de forma instantánea cómo cambia la visibilidad del botón (+).
      */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            if (forcedRole) {
              // Si estamos en una ruta fija (/feed/provider o /feed/client), navegar a la otra
              const targetPath = forcedRole === "provider" ? "/feed/client" : "/feed/provider";
              router.push(targetPath);
            } else {
              switchRole();
            }
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
        MODAL DETALLE: CUANDO EL USUARIO PRESIONA 'VER MÁS'
        =======================================================================
      */}
      {selectedPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-[24px] border border-[#2E2E2E] bg-[#161615] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
              aria-label="Cerrar detalle"
            >
              ✕
            </button>
            <PostCard
              variant="detail"
              imageUrl={selectedPost.post_image}
              name={selectedPost.name}
              about={selectedPost.description}
              tags={selectedPost.tags}
              location={selectedPost.location}
              rating={getUserRating(selectedPost.user_id) || 5}
              offer="Servicios presenciales en la zona especificada. Reserva disponible mediante la aplicación."
              publishedAgo="Hace 2 días"
            />
          </div>
        </div>
      )}

      {/* 
        =======================================================================
        MENÚ DE NAVEGACIÓN INFERIOR (COMÚN A CLIENTE Y PROVEEDOR)
        =======================================================================
        Mantiene intactos los 5 accesos: Inicio, Buscar, Servicios, Mapa, Perfil
      */}
      <NavBar activeId="inicio" />
    </div>
  );
}
