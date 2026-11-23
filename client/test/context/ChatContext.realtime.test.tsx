import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChat } from "@/context/ChatContext";
import { api } from "@/lib/api";
import type { Message } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

// Socket simulado: guardamos la función que registra el contexto para poder "mandar" mensajes.
const socket = vi.hoisted(() => {
  const state = {
    handler: null as null | ((message: { payload: unknown }) => void),
    channelName: "",
    removed: 0,
  };
  const channel = {
    on: (_type: string, _filter: { event: string }, callback: (message: { payload: unknown }) => void) => {
      state.handler = callback;
      return channel;
    },
    subscribe: () => channel,
  };
  return { state, channel };
});

vi.mock("@/lib/supabase", () => ({
  MESSAGE_EVENT: "new-message",
  supabase: {
    channel: (name: string) => {
      socket.state.channelName = name;
      return socket.channel;
    },
    removeChannel: () => {
      socket.state.removed += 1;
    },
  },
}));

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: { id: "user-1" } }) }));

const mockedApi = vi.mocked(api, true);

const fromOther: Message = {
  id: "m5",
  service_request_id: "req-1",
  sender_id: "user-2",
  content: "ya voy en camino",
  created_at: "2026-01-01T00:05:00Z",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChatProvider requestId="req-1">{children}</ChatProvider>
);

const renderLoaded = async () => {
  const hook = renderHook(() => useChat(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

const sendFromSocket = (message: Message) => {
  act(() => {
    socket.state.handler?.({ payload: message });
  });
};

describe("ChatContext realtime (Supabase socket)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.state.handler = null;
    socket.state.removed = 0;
    mockedApi.get.mockResolvedValue({ data: [] });
  });

  it("listens to the channel of the request", async () => {
    await renderLoaded();

    expect(socket.state.channelName).toBe("request:req-1");
  });

  it("adds the message that arrives by socket", async () => {
    const hook = await renderLoaded();

    sendFromSocket(fromOther);

    expect(hook.result.current.messages).toEqual([fromOther]);
  });

  it("does not repeat a message that arrives twice", async () => {
    const hook = await renderLoaded();

    sendFromSocket(fromOther);
    sendFromSocket(fromOther);

    expect(hook.result.current.messages).toHaveLength(1);
  });

  it("does not repeat my own message when it also arrives by socket", async () => {
    const mine: Message = { ...fromOther, id: "m6", sender_id: "user-1", content: "listo" };
    mockedApi.post.mockResolvedValue({ data: mine });
    const hook = await renderLoaded();

    await act(async () => {
      await hook.result.current.createMessage("listo");
    });
    sendFromSocket(mine);

    expect(hook.result.current.messages).toHaveLength(1);
  });

  it("closes the channel when leaving the chat", async () => {
    const hook = await renderLoaded();

    hook.unmount();

    expect(socket.state.removed).toBeGreaterThan(0);
  });
});
