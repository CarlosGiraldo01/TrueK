import Boom from "@hapi/boom";
import type { GeocodeResult } from "./geo.types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "TrueK-App/1.0 (proyecto universitario)";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;

export const GEOCODE_CACHE_MAX_ENTRIES = 500;

const UPSTREAM_ERROR = "No se pudo conectar con el servicio de geocodificación";

interface CacheEntry {
  value: GeocodeResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Próximo instante en que se puede llamar a Nominatim. Se reserva de forma síncrona
// antes de esperar: si solo leyéramos "última petición" y durmiéramos, dos llamadas
// concurrentes leerían el mismo valor y saldrían juntas.
let nextSlotAt = 0;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const normalizeKey = (query: string): string =>
  query.trim().toLowerCase().replace(/\s+/g, " ");

const readCache = (key: string): GeocodeResult | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const writeCache = (key: string, value: GeocodeResult): void => {
  cache.delete(key);
  if (cache.size >= GEOCODE_CACHE_MAX_ENTRIES) {
    // Map conserva el orden de inserción: la primera clave es la más antigua.
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const throttle = async (): Promise<void> => {
  const now = Date.now();
  const slot = Math.max(now, nextSlotAt);
  nextSlotAt = slot + MIN_INTERVAL_MS;
  if (slot > now) await sleep(slot - now);
};

const badGateway = (cause: unknown): Error => {
  console.error("Error de geocodificación (Nominatim):", cause);
  return Boom.badGateway(UPSTREAM_ERROR);
};

const parseResult = (item: unknown): GeocodeResult => {
  if (typeof item !== "object" || item === null) {
    throw badGateway("Resultado con formato inesperado");
  }
  const raw = item as Record<string, unknown>;
  const latitude = Number(raw.lat);
  const longitude = Number(raw.lon);
  const displayName = raw.display_name;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    typeof displayName !== "string"
  ) {
    throw badGateway("Resultado con coordenadas inválidas");
  }
  return { latitude, longitude, display_name: displayName };
};

const geocode = async (query: string): Promise<GeocodeResult> => {
  const key = normalizeKey(query);
  const cached = readCache(key);
  if (cached) return cached;

  await throttle();

  const params = new URLSearchParams({
    format: "json",
    q: query,
    countrycodes: "co",
    limit: "1",
  });

  let body: unknown;
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "es" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Nominatim respondió ${response.status}`);
    }
    body = await response.json();
  } catch (error) {
    throw badGateway(error);
  }

  if (!Array.isArray(body)) {
    throw badGateway("La respuesta no es un arreglo JSON");
  }
  if (body.length === 0) {
    throw Boom.notFound("No se encontró esa dirección");
  }

  const result = parseResult(body[0]);
  writeCache(key, result);
  return result;
};

// Solo para pruebas: limpia la caché y el turno de throttle.
export const resetGeocodeStateForTests = (): void => {
  cache.clear();
  nextSlotAt = 0;
};

export const geoService = { geocode };
