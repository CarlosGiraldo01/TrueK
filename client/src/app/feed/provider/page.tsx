"use client";

import { useEffect } from "react";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

/**
 * Pantalla de Feed Principal en Rol Proveedor (Provider):
 * - El usuario tiene permisos para ofrecer servicios y generar contenido.
 * - Elemento visual clave: Botón superior con icono (+) para crear publicaciones.
 * - Acción: Redirige a /feed/create (formulario de publicación).
 */
export default function ProviderFeedPage() {
  const { setActiveRole, activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "provider") {
      setActiveRole("provider");
    }
  }, [activeRole, setActiveRole]);

  return <FeedView forcedRole="provider" />;
}
