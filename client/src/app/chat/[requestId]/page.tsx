"use client";

import { useSession } from "@/context/SessionContext";
import { use } from "react";
import { NavBar, TopHeader } from "@/components/ui";
import { ChatProvider } from "@/context/ChatContext";
import { getPostById, getRequestById, getUserById } from "@/lib/mock";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

const ChatScreen = ({ requestId }: { requestId: string }) => {
  // The logged user comes from the session (not a fixed id)
  const currentUserId = useSession().user?.id;
  const request = getRequestById(requestId);
  const post = request ? getPostById(request.post_id) : undefined;
    // Only the client and the provider of the service can see his chat
  const isParticipant =
    !!request && !!post && (currentUserId === request.client_id || currentUserId === post.user_id);

  if (!request || !post || !isParticipant) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopHeader title="Mensajes" />
        <p className="m-auto text-sm text-truek-placeholder">No encontramos este chat</p>
        <NavBar activeId="servicios" />
      </div>
    );
  }
  // The other person is the user with the other rol (client-provider, provider-client)
  const otherId = currentUserId === request.client_id ? post.user_id : request.client_id;
  const other = getUserById(otherId);

  return (
    <div className="flex h-dvh flex-col">
      <TopHeader title="Mensajes" />
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-truek-surface">
          <ChatHeader
            name={other?.name ?? "Usuario"}
            picture={other?.profile_picture ?? undefined}
          />
          <MessageList currentUserId={currentUserId} clientId={request.client_id} />
          <MessageInput />
        </div>
      </div>
      <NavBar activeId="servicios" />
    </div>
  );
};

export default function ChatPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return (
    <ChatProvider requestId={requestId}>
      <ChatScreen requestId={requestId} />
    </ChatProvider>
  );
}

