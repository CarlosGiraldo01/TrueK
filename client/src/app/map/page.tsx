"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Map as LeafletMap } from "leaflet";
import { NavBar, TopHeader } from "@/components/ui";
import { usePosts } from "@/context/PostsContext";
import { useSession } from "@/context/SessionContext";
import { useUsers } from "@/context/UsersContext";
import { MapControls } from "./MapControls";
import { ProviderCard } from "./ProviderCard";

const NearbyMap = dynamic(() => import("./NearbyMap"), { ssr: false });

export default function MapPage() {
  const { posts, getPostById } = usePosts();
  const { getUserById } = useUsers();
  const { user } = useSession();
  // This hide the posts that belong to the person who is using the app, no make sense hire yourself
  const othersPosts = posts.filter((post) => post.user_id !== user?.id);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const post = selectedPostId ? getPostById(selectedPostId) : undefined;
  const provider = post ? getUserById(post.user_id) : undefined;

  return (
    <div className="flex h-dvh flex-col">
      <TopHeader title="Mapa" hideBack />
      <div className="relative min-h-0 flex-1">
        <NearbyMap
          posts={othersPosts}
          selectedPostId={selectedPostId}
          onSelectPost={setSelectedPostId}
          onMapReady={setMap}
        />
        {!post && (
          <p className="absolute left-3 top-3 z-1000 rounded-full bg-truek-black/90 px-3 py-1.5 text-xs text-white">
            Toca un punto para ver el servicio
          </p>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-1000 flex flex-col items-end gap-3">
          <MapControls map={map} />
          {post && provider && (
            <div className="pointer-events-auto w-full">
              <ProviderCard post={post} provider={provider} />
            </div>
          )}
        </div>
      </div>
      <NavBar activeId="mapa" />
    </div>
  );
}