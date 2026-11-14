"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { uploadImage, validateImageFile } from "@/lib/uploads";

const GENERIC_ERROR = "No se pudo subir la imagen. Intenta de nuevo.";

export const useImageUpload = (userId: string | null | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada selección incrementa el id; las respuestas de selecciones viejas se ignoran
  const requestIdRef = useRef(0);
  const previewRef = useRef<string | null>(null);

  const replacePreview = useCallback((next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreviewUrl(next);
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    replacePreview(null);
    setImageUrl(null);
    setError(null);
    setIsUploading(false);
  }, [replacePreview]);

  const selectFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        clear();
        return;
      }

      const requestId = ++requestIdRef.current;
      setImageUrl(null);
      setError(null);

      const validationError = validateImageFile(file);
      if (validationError) {
        replacePreview(null);
        setIsUploading(false);
        setError(validationError);
        return;
      }

      if (!userId) {
        replacePreview(null);
        setIsUploading(false);
        setError("Debes iniciar sesión para subir una imagen.");
        return;
      }

      replacePreview(URL.createObjectURL(file));
      setIsUploading(true);

      try {
        const uploaded = await uploadImage(file, userId);
        if (requestId !== requestIdRef.current) return;
        setImageUrl(uploaded.url);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const serverMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
        setImageUrl(null);
        setError(typeof serverMessage === "string" && serverMessage ? serverMessage : GENERIC_ERROR);
      } finally {
        if (requestId === requestIdRef.current) setIsUploading(false);
      }
    },
    [userId, clear, replacePreview]
  );

  return { imageUrl, previewUrl, isUploading, error, selectFile, clear };
};
