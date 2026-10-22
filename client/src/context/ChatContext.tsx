"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "./SessionContext";
import type { Message } from "@/types";

interface ChatContextValue {
  messages: Message[];
  loading: boolean;
  error: string | null;
  createMessage: (content: string) => void;
}

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

  // Simulated: in this moment the message only lives in memory.
  const createMessage = (content: string) => {
    const message: Message = {
      id: `m${Date.now()}`,
      service_request_id: requestId,
      sender_id: user?.id ?? "",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
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