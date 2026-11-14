"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
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
        if (!cancelled) setMessages(res.data);
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