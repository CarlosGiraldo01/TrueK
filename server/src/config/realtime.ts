import { supabase } from './supabase';

// Nombres de los eventos que escucha el cliente
export const NOTIFICATION_EVENT = 'new-notification'; // aviso nuevo para un usuario
export const MESSAGE_EVENT = 'new-message'; // mensaje nuevo en el chat de una solicitud
export const PAYMENT_EVENT = 'payment-confirmed'; // el cliente pagó un servicio

// Socket con Supabase Realtime (Broadcast): manda un evento (event + payload) a un canal.
const broadcast = async (channelName: string, event: string, payload: object): Promise<void> => {
  const channel = supabase.channel(channelName);

  try {
    await channel.httpSend(event, payload);
  } catch (error) {
    console.error('No se pudo enviar el evento en vivo al canal', channelName, error);
  } finally {
    await supabase.removeChannel(channel);
  }
};

// Cada usuario escucha su propio canal 
export const broadcastToUser = (userId: string, event: string, payload: object): Promise<void> =>
  broadcast(`user:${userId}`, event, payload);

// Los dos que están en el chat de una solicitud escuchan el canal "request:<id>".
export const broadcastToRequest = (requestId: string, event: string, payload: object): Promise<void> =>
  broadcast(`request:${requestId}`, event, payload);
