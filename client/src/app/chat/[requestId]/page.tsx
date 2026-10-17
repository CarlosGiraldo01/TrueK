"use client";

import { use, useState } from "react";
import { NavBar, TopHeader } from "@/components/ui";
import {
  CURRENT_USER_ID,
  getMessagesByRequest,
  getPostById,
  getRequestById,
  getUserById,
} from "@/lib/mock";
import type { Message } from "@/lib/mock";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

export default function ChatPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);
  const request = getRequestById(requestId);
  const post = request ? getPostById(request.post_id) : undefined;
  const [messages, setMessages] = useState<Message[]>(() => getMessagesByRequest(requestId));

    // Only the client and the provider of the service can see his chat
  const isParticipant =!!request && !!post && (CURRENT_USER_ID === request.client_id || CURRENT_USER_ID === post.user_id);
    if (!request || !post || !isParticipant) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopHeader title="Mensajes" />
        <p className="m-auto text-sm text-truek-placeholder">No existe este chat</p>
        <NavBar activeId="servicios" />
      </div>
    );
  }

  // The other person is the user with the other rol (client-provider, provider-client)
  const otherId = CURRENT_USER_ID === request.client_id ? post.user_id : request.client_id;
  const other = getUserById(otherId);

  const handleSend = (content: string) => {
    const message: Message = {
      id: `m${Date.now()}`,
      service_request_id: request.id,
      sender_id: CURRENT_USER_ID,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="flex h-dvh flex-col">
      <TopHeader title="Mensajes" />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-truek-surface">
          <ChatHeader
            name={other?.name ?? "Usuario"}
            picture={other?.profile_picture ?? undefined}
          />
          <MessageList
            messages={messages}
            currentUserId={CURRENT_USER_ID}
            clientId={request.client_id}
          />
          <MessageInput onSend={handleSend} />
        </div>
      </div>
      <NavBar activeId="servicios" />
    </div>
  );
}