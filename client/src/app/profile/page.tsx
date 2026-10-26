"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { StarRating } from "@/components/ui/StarRating";
import { Logo } from "@/components/ui/Logo";
import { NavBar } from "@/components/ui/NavBar";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";

// Vista de perfil del usuario (cambia según si es proveedor o cliente)
export default function ProfilePage() {
  const router = useRouter();
  const { user, activeRole } = useSession();
  const { getPostsByUserId } = usePosts();

  const isProvider = activeRole === "provider";

  // Publicaciones creadas por este usuario si es proveedor
  const providerPosts = user ? getPostsByUserId(user.id) : [];

  // Volver al feed del rol actual
  const handleBack = () => {
    if (isProvider) {
      router.push("/feed/provider");
    } else {
      router.push("/feed/client");
    }
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleSeePost = (postId: string) => {
    router.push("/post/" + postId);
  };

  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#161615] px-6 text-center text-white">
        <h2 className="text-lg font-bold">No has iniciado sesión</h2>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 rounded-xl bg-[#D3FC31] px-5 py-2.5 text-sm font-bold text-black cursor-pointer"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      
      {/* Header simple con botón de regreso */}
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
          Perfil
        </h1>

        <div className="size-10" />
      </header>

      {/* Contenido principal */}
      <main className="flex-1 px-5 py-6 pb-28">
        <div className="flex flex-col items-center text-center">
          
          {/* Avatar con botón para editar */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="size-24 overflow-hidden rounded-full border-2 border-[#3A3A39] shadow-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.profile_picture || "/brand/logo-icon.png"}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={handleEditProfile}
              className="absolute -right-2 top-1 flex size-8 items-center justify-center rounded-full bg-[#1F1F1E] border border-[#3A3A39] text-[#D3FC31] shadow-lg hover:border-[#D3FC31] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Editar perfil"
              title="Editar perfil"
            >
              <PencilSquareIcon className="size-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-white">{user.name}</h2>

          {/* Badge de rol */}
          <div className="mt-1.5 flex items-center justify-center">
            <span className="rounded-full bg-[#132816] border border-[#1C4223] px-3.5 py-0.5 text-xs font-bold text-[#4ADE80] shadow-sm">
              {isProvider ? "Prestador" : "Cliente"}
            </span>
          </div>

          {/* Estrellas (solo si es proveedor) */}
          {isProvider && (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              <StarRating value={user.rating ?? 4.7} size={15} />
              <span className="text-xs font-bold text-white/90">
                {(user.rating ?? 4.7).toFixed(1)}
              </span>
            </div>
          )}

          <p className="mt-1.5 text-xs font-medium text-[#8A8A8A]">
            {user.age} años · {user.location}
          </p>

          {/* Tarjeta de descripción */}
          <div className="mt-4 w-full rounded-[18px] border border-[#2E2E2E] bg-[#1B1B1B] p-4 text-left shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Descripción
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/80">
              {user.description}
            </p>
          </div>

          {/* Sección de cliente: Trueks tomados */}
          {!isProvider && (
            <div className="mt-4 w-full rounded-[18px] border border-[#2E2E2E] bg-[#1B1B1B] p-4 text-left shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Cuántos Trueks ha tomado:
              </h3>
              <div className="mt-2.5 rounded-[12px] border border-[#383838] bg-black/60 px-4 py-2.5 text-center text-xs font-semibold text-white/90">
                {(user.trueks_count ?? 10) + " Trueks"}
              </div>
            </div>
          )}

          {/* Sección de proveedor: Cuadrícula de sus publicaciones */}
          {isProvider && (
            <div className="mt-5 w-full flex flex-col gap-4">
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="h-[1px] flex-1 bg-[#2E2E2E]" />
                <Logo variant="horizontal" height={18} className="opacity-80" />
                <div className="h-[1px] flex-1 bg-[#2E2E2E]" />
              </div>

              {providerPosts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {providerPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => handleSeePost(post.id)}
                      className="group flex flex-col overflow-hidden rounded-[18px] border border-[#2E2E2E] bg-[#1B1B1B] p-2.5 text-left transition-all hover:border-[#3E3E3E] hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.post_image}
                          alt={post.name}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <h4 className="mt-2 text-xs font-bold text-white truncate">
                        {post.name}
                      </h4>

                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#2E2E2E] bg-black px-2 py-0.5 text-[9px] text-white/90 truncate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-1 flex items-center">
                        <StarRating value={post.rating ?? 4.7} size={11} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#383838] bg-[#1B1B1B] p-6 text-center">
                  <p className="text-xs text-[#8A8A8A]">
                    Aún no has creado publicaciones de trueks.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/feed/create")}
                    className="mt-3 rounded-xl bg-[#FF5E1B] px-4 py-2 text-xs font-bold text-black cursor-pointer"
                  >
                    Crear mi primer truek
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Menú inferior */}
      <NavBar activeId="perfil" />
    </div>
  );
}