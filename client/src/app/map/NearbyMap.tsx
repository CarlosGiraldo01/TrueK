"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { AttributionControl, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { Post } from "@/types";

const dotIcon = (color: string, size: number, border: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid ${border};box-shadow:0 1px 6px rgba(0,0,0,.5)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const userIcon = dotIcon("#2563EB", 18, "#FFFFFF");
const pinIcon = dotIcon("#D3FC31", 22, "#161615");
const selectedPinIcon = dotIcon("#FF5E1B", 30, "#161615");

interface NearbyMapProps {
  posts: Post[];
  userPosition: [number, number];
  source: string;
  selectedPostId: string | null;
  onSelectPost: (postId: string) => void;
  onMapReady: (map: L.Map | null) => void;
}

// MapContainer solo aplica center/bounds al montar, así que re-encuadramos aquí.
// Solo se re-encuadra cuando cambian los posts o la fuente de ubicación; los cambios
// de posición en vivo mueven el punto azul pero no la vista (el usuario puede estar explorando).
function FitView({ userPosition, posts, source }: { userPosition: [number, number]; posts: Post[]; source: string }) {
  const map = useMap();
  const latestRef = useRef({ userPosition, posts });
  // Clave estable: el arreglo de posts puede cambiar de identidad sin cambiar de contenido
  const postsKey = posts.map((p) => `${p.id}:${p.latitude}:${p.longitude}`).join("|");

  // Se declara antes del efecto de encuadre para que éste lea siempre los valores actuales
  useEffect(() => {
    latestRef.current = { userPosition, posts };
  });

  useEffect(() => {
    const { userPosition: pos, posts: current } = latestRef.current;
    if (current.length === 0) {
      map.setView(pos, 14);
      return;
    }
    const bounds = L.latLngBounds([pos, ...current.map((p) => [p.latitude, p.longitude] as [number, number])]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, source, postsKey]);

  return null;
}

export default function NearbyMap({ posts, userPosition, source, selectedPostId, onSelectPost, onMapReady }: NearbyMapProps) {
  return (
    <MapContainer
      center={userPosition}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
      ref={onMapReady}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AttributionControl position="topright" prefix={false} />

      <FitView userPosition={userPosition} posts={posts} source={source} />
      <Marker position={userPosition} icon={userIcon} />
      {posts.map((post) => (
        <Marker
          key={post.id}
          position={[post.latitude, post.longitude]}
          icon={post.id === selectedPostId ? selectedPinIcon : pinIcon}
          eventHandlers={{ click: () => onSelectPost(post.id) }}
        />
      ))}
    </MapContainer>
  );
}