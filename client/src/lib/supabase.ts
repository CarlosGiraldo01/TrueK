import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para el navegador: solo usa la llave pública (publishable), nunca la secreta.
// Se usa para escuchar los eventos en vivo (sockets) que manda el servidor.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
);

// Mismo nombre de evento que usa el servidor (server/src/config/realtime.ts)
export const NOTIFICATION_EVENT = "new-notification";
