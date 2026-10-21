"use client";

import { FeedView } from "@/components/feed/FeedView";

/**
 * Ruta dinámica /feed que renderiza según el rol activo de la sesión.
 */
export default function MainFeedPage() {
  return <FeedView />;
}
