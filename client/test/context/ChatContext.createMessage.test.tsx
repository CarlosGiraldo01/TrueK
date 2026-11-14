import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChat } from "@/context/ChatContext";
import { api } from "@/lib/api";
import type { Message } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const sessionState = vi.hoisted(() => ({ user: { id: "user-1" } as { id: string } | null }));

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));

const mockedApi = vi.mocked(api, true);

const existing: Message = {
  id: "m1",
  service_request_id: "req-1",
  sender_id: "user-2",
  content: "hola",
  created_at: "2026-01-01T00:00:00Z",
};
const created: Message = {
  id: "m2",
  service_request_id: "req-1",
  sender_id: "user-1",
  content: "buenas",
  created_at: "2026-01-01T00:01:00Z",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChatProvider requestId="req-1">{children}</ChatProvider>
);

const renderLoaded = async () => {
  const hook = renderHook(() => useChat(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe("ChatContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.user = { id: "user-1" };
    mockedApi.get.mockResolvedValue({ data: [existing] });
  });

  it("loads the history of the request with the service_request_id param", async () => {
    const { result } = await renderLoaded();

    expect(mockedApi.get).toHaveBeenCalledWith("/messages", { params: { service_request_id: "req-1" } });
    expect(result.current.messages).toEqual([existing]);
  });

  it("posts the content with the session user and request id", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.createMessage("buenas");
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/messages", {
      user_id: "user-1",
      service_request_id: "req-1",
      content: "buenas",
    });
  });

  it("appends the message returned by the server", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.createMessage("buenas");
    });

    expect(result.current.messages).toEqual([existing, created]);
  });

  it("returns the created message", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();

    let returned: Message | undefined;
    await act(async () => {
      returned = await result.current.createMessage("buenas");
    });

    expect(returned).toEqual(created);
  });

  it("does not duplicate a message that is already in the list", async () => {
    mockedApi.post.mockResolvedValue({ data: existing });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.createMessage("hola");
    });

    expect(result.current.messages).toEqual([existing]);
  });

  it("rejects and leaves the messages unchanged when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.createMessage("buenas")).rejects.toThrow("boom");
    });

    expect(result.current.messages).toEqual([existing]);
  });

  it("throws without calling the api when there is no session user", async () => {
    sessionState.user = null;
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.createMessage("buenas")).rejects.toThrow(
        "Debes iniciar sesión para enviar mensajes",
      );
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
