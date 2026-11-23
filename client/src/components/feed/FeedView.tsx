"use client";

import { DEFAULT_POST_IMAGE } from "@/lib/postImage";
import { useRouter } from "next/navigation";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { PostCard } from "@/components/ui/PostCard";
import { NavBar } from "@/components/ui/NavBar";
import { useSession } from "@/context/SessionContext";
import { usePosts } from "@/context/PostsContext";
import { useRequests } from "@/context/RequestContext";

// Vista principal del feed: muestra las publicaciones y maneja los roles
export function FeedView() {
  const router = useRouter();
  const { activeRole } = useSession();
  const { posts } = usePosts();
  const { getUserRating } = useRequests();

  // El rol es el de la cuenta: un cliente nunca ve el botón de crear publicación
  const currentRole = activeRole;
  const isProvider = currentRole === "provider";

  const handleCreatePost = () => {
    router.push("/feed/create");
  };

  const handleSeeMore = (postId: string) => {
    router.push("/post/" + postId);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#161615] text-white selection:bg-[#D3FC31] selection:text-black">
      
      {/* Header del feed (cambia el botón de crear según el rol) */}
      <FeedHeader
        role={currentRole}
        onCreatePost={isProvider ? handleCreatePost : undefined}
      />

      {/* Listado de publicaciones */}
      <main className="flex-1 px-4 py-4 pb-28">
        <div className="flex flex-col gap-5">
          {posts.map((post) => {
            const rating = post.rating ?? getUserRating(post.user_id) ?? 5;

            return (
              <PostCard
                key={post.id}
                imageUrl={post.post_image ?? DEFAULT_POST_IMAGE}
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


      {/* Menú inferior */}
      <NavBar activeId="inicio" />
    </div>
  );
}