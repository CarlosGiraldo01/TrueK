"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const UNSUPPORTED_ERROR = "Tu navegador no permite obtener la ubicación";
const PERMISSION_ERROR = "No diste permiso para usar tu ubicación";
const UNAVAILABLE_ERROR = "No se pudo determinar tu ubicación";
const TIMEOUT_ERROR = "Se agotó el tiempo para obtener tu ubicación";

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 };

const errorMessage = (code: number): string => {
  if (code === 1) return PERMISSION_ERROR;
  if (code === 3) return TIMEOUT_ERROR;
  return UNAVAILABLE_ERROR;
};

const subscribeNoop = (): (() => void) => () => {};
const getSupported = (): boolean => "geolocation" in navigator;
// En el servidor se asume soportado para que la hidratación coincida
const getServerSupported = (): boolean => true;

export const useGeolocation = () => {
  const isSupported = useSyncExternalStore(subscribeNoop, getSupported, getServerSupported);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setError(null);
        setIsLoading(false);
      },
      (geoError) => {
        setError(errorMessage(geoError.code));
        setIsLoading(false);
      },
      GEO_OPTIONS,
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSupported]);

  if (!isSupported) return { position: null, error: UNSUPPORTED_ERROR, isLoading: false };
  return { position, error, isLoading };
};
