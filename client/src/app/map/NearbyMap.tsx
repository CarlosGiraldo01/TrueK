"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AttributionControl, MapContainer, Marker, TileLayer } from "react-leaflet";
import type { Post } from "@/lib/mock";
import { USER_POSITION } from "./constants";

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
  selectedPostId: string | null;
  onSelectPost: (postId: string) => void;
  onMapReady: (map: L.Map | null) => void;
}

export default function NearbyMap({ posts, selectedPostId, onSelectPost, onMapReady }: NearbyMapProps) {
  
  const bounds = L.latLngBounds([USER_POSITION, ...posts.map((p) => [p.latitude, p.longitude] as [number, number])]);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
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

      <Marker position={USER_POSITION} icon={userIcon} />
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