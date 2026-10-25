"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Logo } from "@/components/ui/Logo";
import { PostCard } from "@/components/ui/PostCard";
import { NavBar } from "@/components/ui/NavBar";
import { usePosts } from "@/context/PostsContext";
import { useRequests } from "@/context/RequestContext";

// Vista de búsqueda para encontrar trueks por texto o categorías
export default function SearchPage() {
  const router = useRouter();
  const { posts, tags } = usePosts();
  const { getUserRating } = useRequests();

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Saber si hay algún filtro o texto escrito
  const hasActiveFilter = Boolean(query.trim() || selectedTag);

  // Filtrar posts según la categoría o el texto que escriban
  const filteredPosts = hasActiveFilter
    ? posts.filter((post) => {
        if (selectedTag && !post.tags.includes(selectedTag)) {
          return false;
        }
        if (!query.trim()) return true;

        const q = query.trim().toLowerCase();
        return (
          post.name.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.location.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : [];

  // Activar o quitar categoría al hacer click
  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  const handleSeeMore = (postId: string) => {
    router.push("/post/" + postId);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      
      {/* Header con el logo */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#242423] bg-[#161615] px-4">
        <Logo variant="horizontal" height={26} />
      </header>

      {/* Contenido principal de búsqueda */}
      <main className="flex-1 px-4 py-4 pb-28">
        
        {/* Barra de búsqueda */}
        <div className="relative mb-5 flex items-center">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 size-5 text-[#8A8A8A]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="h-11 w-full rounded-[14px] bg-[#242423] pl-10 pr-4 text-sm text-white placeholder:text-[#5F5F5F] outline-none transition-all focus:ring-1.5 focus:ring-[#D3FC31]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 text-xs text-[#8A8A8A] hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categorías (píldoras) */}
        <div className="mb-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Categorías
            </h2>
            <AdjustmentsHorizontalIcon className="size-4 text-[#8A8A8A]" />
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={
                    "rounded-full px-3.5 py-1 text-xs font-medium transition-all cursor-pointer " +
                    (isSelected
                      ? "border border-[#D3FC31] bg-[#D3FC31] text-black font-bold shadow-md"
                      : "border border-[#383838] bg-black text-[#9CA3AF] hover:text-white")
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 flex items-center justify-between border-t border-[#242423] pt-3">
          <h3 className="text-xs font-bold text-white">
            Resultados ( {filteredPosts.length} )
          </h3>
          {selectedTag && (
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-[11px] text-[#D3FC31] underline cursor-pointer hover:opacity-80"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Listado de resultados */}
        {filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => {
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
        ) : hasActiveFilter ? (
          <div className="mt-8 text-center text-xs text-[#8A8A8A]">
            No se encontraron publicaciones para el criterio seleccionado.
          </div>
        ) : null}
      </main>

      <NavBar activeId="buscar" />
    </div>
  );
}