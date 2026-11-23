"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MESSAGE_EVENT, supabase } from "@/lib/supabase";
import { useSession } from "./SessionContext";
import type { Message } from "@/types";

interface ChatContextValue {
  messages: Message[];
  loading: boolean;
  error: string | null;
  createMessage: (content: string) => Promise<Message>;
}

export const MESSAGE_MAX_LENGTH = 1000;

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({
  requestId,
  children,
}: {
  requestId: string;
  children: React.ReactNode;
}) => {
  const { user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pide al servidor los mensajes de esta solicitud.
  useEffect(() => {
    let cancelled = false;

    api
      .get<Message[]>("/messages", { params: { service_request_id: requestId } })
      .then((res) => {
        if (cancelled) return;
        // Se juntan con los que ya llegaron por el socket mientras cargaba, sin repetir.
        setMessages((prev) => [...res.data, ...prev.filter((m) => !res.data.some((d) => d.id === m.id))]);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los mensajes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  // Socket (Supabase Realtime): escucha el canal de esta solicitud. Cuando la otra persona
  // envía un mensaje, el servidor lo manda por aquí y aparece sin recargar la página.
  useEffect(() => {
    const channel = supabase
      .channel(`request:${requestId}`)
      .on("broadcast", { event: MESSAGE_EVENT }, ({ payload }) => {
        const message = payload as Message;
        // Si ya lo tenemos (por ejemplo, el que yo mismo envié) no se repite.
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      })
      .subscribe();

    // Al salir del chat se cierra el canal.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  // Los errores se propagan para que el formulario los muestre.
  const createMessage = async (content: string): Promise<Message> => {
    if (!user) throw new Error("Debes iniciar sesión para enviar mensajes");
    const res = await api.post<Message>("/messages", {
      user_id: user.id,
      service_request_id: requestId,
      content,
    });
    const created = res.data;
    // Idempotente: evita duplicados si el mismo mensaje llega por otra vía.
    setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
    return created;
  };
  return (
    <ChatContext.Provider value={{ messages, loading, error, createMessage }}>{children}</ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};