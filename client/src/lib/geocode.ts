import { api } from "@/lib/api";

export const GEOCODE_MIN_LENGTH = 3;
export const GEOCODE_MAX_LENGTH = 200;

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
}

// Solo se debe llamar tras una acción explícita (clic o envío): Nominatim prohíbe el autocompletado
export const geocodeAddress = async (q: string): Promise<GeocodeResult> => {
  const res = await api.get<GeocodeResult>("/geocode", { params: { q } });
  return res.data;
};
