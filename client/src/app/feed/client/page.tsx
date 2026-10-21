"use client";

import { FeedView } from "@/components/feed/FeedView";

/**
 * Pantalla de Feed Principal en Rol Cliente (Client):
 * - El usuario tiene un rol pasivo de búsqueda, consumo e interacción básica.
 * - Elemento visual clave: El botón (+) está completamente destruido del árbol DOM.
 * - Restricción: No existe ruta visual ni funcional para publicar en esta sección.
 */
export default function ClientFeedPage() {
  return <FeedView forcedRole="client" />;
}
