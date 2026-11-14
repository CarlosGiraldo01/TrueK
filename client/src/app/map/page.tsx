"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Map as LeafletMap } from "leaflet";
import { NavBar, TopHeader } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { useUsers } from "@/context/UsersContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyPosts } from "@/hooks/useNearbyPosts";
import { NEARBY_RADIUS_KM } from "@/lib/geo";
import { FALLBACK_POSITION } from "./constants";
import { MapControls } from "./MapControls";
import { ProviderCard } from "./ProviderCard";

const NearbyMap = dynamic(() => import("./NearbyMap"), { ssr: false });

type CenterSource = "browser" | "profile" | "fallback";

const pillClass = "rounded-full bg-truek-black/90 px-3 py-1.5 text-xs text-white";

export default function MapPage() {
  const { getUserById } = useUsers();
  const { user } = useSession();
  const { position, error: geoError, isLoading: geoLoading } = useGeolocation();

  const profileLat = user?.latitude ?? null;
  const profileLng = user?.longitude ?? null;
  const hasProfilePosition = profileLat !== null && profileLng !== null;

  // Prioridad: navegador > perfil > Cali. No caemos a Cali mientras la geolocalización carga.
  const resolved = useMemo(() => {
    if (position) {
      return { center: position, source: "browser" as CenterSource };
    }
    if (hasProfilePosition) {
      return { center: { latitude: profileLat, longitude: profileLng }, source: "profile" as CenterSource };
    }
    if (geoLoading) return null;
    return {
      center: { latitude: FALLBACK_POSITION[0], longitude: FALLBACK_POSITION[1] },
      source: "fallback" as CenterSource,
    };
  }, [position, hasProfilePosition, profileLat, profileLng, geoLoading]);

  const center = resolved?.center ?? null;
  const userPosition = useMemo<[number, number] | null>(
    () => (center ? [center.latitude, center.longitude] : null),
    [center],
  );

  const { posts, isLoading, error } = useNearbyPosts(center, NEARBY_RADIUS_KM);
  // Oculta las publicaciones de quien usa la app: no tiene sentido contratarse a sí mismo
  const othersPosts = useMemo(() => posts.filter((p) => p.user_id !== user?.id), [posts, user?.id]);

  const [map, setMap] = useState<LeafletMap | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const post = selectedPostId ? othersPosts.find((p) => p.id === selectedPostId) : undefined;
  const provider = post ? getUserById(post.user_id) : undefined;
  const isEmpty = !isLoading && !error && othersPosts.length === 0;

  return (
    <div className="flex h-dvh flex-col">
      <TopHeader title="Mapa" hideBack />
      <div className="relative min-h-0 flex-1">
        {userPosition ? (
          <NearbyMap
            posts={othersPosts}
            userPosition={userPosition}
            source={resolved?.source ?? "fallback"}
            selectedPostId={selectedPostId}
            onSelectPost={setSelectedPostId}
            onMapReady={setMap}
          />
        ) : (
          <p role="status" className="flex h-full items-center justify-center text-sm text-white/80">
            Obteniendo tu ubicación…
          </p>
        )}

        <div className="absolute left-3 top-3 z-1000 flex flex-col items-start gap-2">
          {userPosition && !post && !isEmpty && <p className={pillClass}>Toca un punto para ver el servicio</p>}
          {resolved?.source === "profile" && (
            <p role="status" className={pillClass}>
              Usando la ubicación de tu perfil
            </p>
          )}
          {resolved?.source === "fallback" && (
            <p role="status" className={pillClass}>
              Ubicación aproximada (Cali){geoError ? `. ${geoError}` : ""}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-full bg-red-600/90 px-3 py-1.5 text-xs text-white">
              {error}
            </p>
          )}
        </div>

        {userPosition && isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-1000 flex items-center justify-center p-6">
            <p role="status" className="rounded-2xl bg-truek-black/90 px-4 py-3 text-center text-sm text-white">
              No hay servicios cerca de ti en este momento
            </p>
          </div>
        )}

        {userPosition && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-1000 flex flex-col items-end gap-3">
            <MapControls map={map} userPosition={userPosition} />
            {post && provider && (
              <div className="pointer-events-auto w-full">
                <ProviderCard post={post} provider={provider} />
              </div>
            )}
          </div>
        )}
      </div>
      <NavBar activeId="mapa" />
    </div>
  );
}
