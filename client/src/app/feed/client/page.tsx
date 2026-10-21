"use client";

import { useEffect } from "react";
import { FeedView } from "@/components/feed/FeedView";
import { useSession } from "@/context/SessionContext";

/**
 * Pantalla de Feed Principal en Rol Cliente (Client):
 * - El usuario tiene un rol pasivo de búsqueda, consumo e interacción básica.
 * - Elemento visual clave: El botón (+) está completamente destruido del árbol DOM.
 * - Restricción: No existe ruta visual ni funcional para publicar en esta sección.
 */
export default function ClientFeedPage() {
  const { setActiveRole, activeRole } = useSession();

  useEffect(() => {
    if (activeRole !== "client") {
      setActiveRole("client");
    }
  }, [activeRole, setActiveRole]);

  return <FeedView forcedRole="client" />;
}
