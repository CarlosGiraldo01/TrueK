import { api } from "@/lib/api";
import type { Post } from "@/types";

export const getNearbyPosts = async (lat: number, lng: number, radiusKm: number): Promise<Post[]> => {
  const res = await api.get<Post[]>("/posts", { params: { lat, lng, radius_km: radiusKm } });
  return res.data;
};
