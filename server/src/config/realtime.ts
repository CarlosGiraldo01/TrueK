import { supabase } from './supabase';

// Nombre del evento que escucha el cliente cuando le llega un aviso nuevo
export const NOTIFICATION_EVENT = 'new-notification';

// Socket con Supabase Realtime (Broadcast): manda un evento al canal de un usuario.
// Cada usuario escucha su propio canal "user:<id>", así solo le llegan sus avisos.
// Si el envío falla no se rompe la petición, porque el cambio ya quedó guardado en la base de datos.
export const broadcastToUser = async (userId: string, event: string, payload: object): Promise<void> => {
  const channel = supabase.channel(`user:${userId}`);

  try {
    await channel.httpSend(event, payload);
  } catch (error) {
    console.error('No se pudo enviar el evento en vivo al usuario', userId, error);
  } finally {
    await supabase.removeChannel(channel);
  }
};
