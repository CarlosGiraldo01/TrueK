"use client";

import { FeedView } from "@/components/feed/FeedView";

/**
 * Pantalla de Feed Principal en Rol Proveedor (Provider):
 * - El usuario tiene permisos para ofrecer servicios y generar contenido.
 * - Elemento visual clave: Botón flotante / superior con icono (+) para crear publicaciones.
 * - Acción: Redirige a /feed/create (formulario de publicación).
 */
export default function ProviderFeedPage() {
  return <FeedView forcedRole="provider" />;
}
