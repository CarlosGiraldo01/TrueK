"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GEOCODE_MAX_LENGTH, GEOCODE_MIN_LENGTH, geocodeAddress } from "@/lib/geocode";
import type { GeocodeResult } from "@/lib/geocode";
import { getErrorMessage } from "@/lib/errors";

const GENERIC_ERROR = "No se pudo buscar la ubicación. Intenta de nuevo.";

interface GeocodeInitial {
  query: string;
  result: GeocodeResult | null;
}

export const useGeocode = (initial?: GeocodeInitial) => {
  const [result, setResult] = useState<GeocodeResult | null>(initial?.result ?? null);
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(
    initial?.result ? initial.query.trim() : null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada búsqueda incrementa el id; las respuestas de búsquedas viejas se ignoran
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const search = useCallback(async (query: string): Promise<GeocodeResult | null> => {
    const q = query.trim();
    const requestId = ++requestIdRef.current;
    setError(null);

    if (q.length < GEOCODE_MIN_LENGTH) {
      setIsSearching(false);
      setError(`Escribe al menos ${GEOCODE_MIN_LENGTH} caracteres para buscar la ubicación.`);
      return null;
    }
    if (q.length > GEOCODE_MAX_LENGTH) {
      setIsSearching(false);
      setError(`La ubicación no puede superar ${GEOCODE_MAX_LENGTH} caracteres.`);
      return null;
    }

    setIsSearching(true);
    try {
      const found = await geocodeAddress(q);
      if (requestId !== requestIdRef.current) return null;
      setResult(found);
      setResolvedQuery(q);
      return found;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;
      setResult(null);
      setResolvedQuery(null);
      setError(getErrorMessage(err, GENERIC_ERROR));
      return null;
    } finally {
      if (requestId === requestIdRef.current) setIsSearching(false);
    }
  }, []);

  const isResolvedFor = useCallback(
    (query: string): boolean => result !== null && resolvedQuery === query.trim(),
    [result, resolvedQuery]
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setResult(null);
    setResolvedQuery(null);
    setError(null);
    setIsSearching(false);
  }, []);

  return { result, isSearching, error, search, resolvedQuery, isResolvedFor, reset };
};
