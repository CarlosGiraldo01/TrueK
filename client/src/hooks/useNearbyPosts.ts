"use client";

import { useEffect, useRef, useState } from "react";
import { haversineKm, REQUERY_DISTANCE_KM } from "@/lib/geo";
import { getNearbyPosts } from "@/lib/posts";
import { getErrorMessage } from "@/lib/errors";
import type { Post } from "@/types";

interface Center {
  latitude: number;
  longitude: number;
}

const GENERIC_ERROR = "No se pudieron cargar los servicios cercanos";

export const useNearbyPosts = (center: Center | null, radiusKm: number) => {
  const [posts, setPosts] = useState<Post[]>([]);
  // Arranca en true: evita un instante de "sin resultados" antes de la primera consulta
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastCenterRef = useRef<Center | null>(null);
  const lastRadiusRef = useRef<number | null>(null);
  // Cada consulta incrementa el id; las respuestas viejas se ignoran
  const requestIdRef = useRef(0);

  const latitude = center?.latitude;
  const longitude = center?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const next = { latitude, longitude };

    const last = lastCenterRef.current;
    if (
      last &&
      lastRadiusRef.current === radiusKm &&
      haversineKm(last, next) <= REQUERY_DISTANCE_KM
    ) {
      return;
    }

    lastCenterRef.current = next;
    lastRadiusRef.current = radiusKm;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    getNearbyPosts(latitude, longitude, radiusKm)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setPosts(result);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        // Permite reintentar en el próximo cambio de posición
        lastCenterRef.current = null;
        setError(getErrorMessage(err, GENERIC_ERROR));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, [latitude, longitude, radiusKm]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      // Strict Mode simula desmontar y volver a montar: sin esto la segunda corrida
      // vería el centro ya guardado, no consultaría y la respuesta en vuelo quedaría descartada
      lastCenterRef.current = null;
      lastRadiusRef.current = null;
    };
  }, []);

  return { posts, isLoading, error };
};
