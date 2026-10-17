"use client";

import { createContext, useContext, useState } from "react";
import { CURRENT_USER_ID, getMessagesByRequest } from "@/lib/mock";
import type { Message } from "@/lib/mock";

interface ChatContextValue {
  messages: Message[];
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
  const [messages, setMessages] = useState<Message[]>(() => getMessagesByRequest(requestId));

  // Simulated: in this moment the message only lives in memory.
  const createMessage = (content: string) => {
    const message: Message = {
      id: `m${Date.now()}`,
      service_request_id: requestId,
      sender_id: CURRENT_USER_ID,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
  };
  return (
    <ChatContext.Provider value={{ messages, createMessage }}>{children}</ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};