"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  currentUserId: string;
  clientId: string; 
}

// This a better way to show the hour
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });

export function MessageList({ currentUserId, clientId }: MessageListProps) {
  const { messages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // And this show the newest message, making a coherent order in the chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
      {messages.length === 0 && (
        <p className="m-auto text-sm text-truek-placeholder">Escribe el primer mensaje</p>
      )}
      {messages.length > 0 && (
        <p className="my-1 text-center text-xs text-truek-placeholder">
          {formatTime(messages[0].created_at)}
        </p>
      )}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          content={message.content}
          mine={message.sender_id === currentUserId}
          senderRole={message.sender_id === clientId ? "client" : "provider"}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}