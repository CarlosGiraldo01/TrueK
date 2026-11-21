import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestsProvider, useRequests } from "@/context/RequestContext";
import { api } from "@/lib/api";
import type { RequestNotificationEvent, ServiceRequest } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

// Socket simulado: guardamos la función que registra el contexto para poder "mandar" eventos.
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
  NOTIFICATION_EVENT: "new-notification",
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

const sessionState = vi.hoisted(() => ({ user: { id: "prov-1" } as { id: string } | null }));
const showNotification = vi.hoisted(() => vi.fn());

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));
vi.mock("@/context/NotificationsContext", () => ({ useNotifications: () => ({ showNotification }) }));
vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById: () => ({ tags: ["plomeria"] }) }) }));
vi.mock("@/context/UsersContext", () => ({
  useUsers: () => ({ getUserById: (id: string) => ({ id, name: `Nombre ${id}`, profile_picture: null }) }),
}));

const mockedApi = vi.mocked(api, true);

const newRequest: ServiceRequest = {
  id: "req-9",
  post_id: "post-1",
  client_id: "client-1",
  provider_id: "prov-1",
  meeting_address: "Calle 1",
  meeting_date: "2030-05-10T20:30:00.000Z",
  hours: 2,
  status: "pending",
  request_image: null,
  payment_confirmed: false,
  price: 100,
};

const wrapper = ({ children }: { children: ReactNode }) => <RequestsProvider>{children}</RequestsProvider>;

const sendEvent = (event: RequestNotificationEvent) => {
  act(() => {
    socket.state.handler?.({ payload: event });
  });
};

describe("RequestsContext realtime (Supabase socket)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socket.state.handler = null;
    socket.state.removed = 0;
    sessionState.user = { id: "prov-1" };
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === "/ratings/averages") return { data: {} };
      if (url.startsWith("/requests/current/")) return { data: null };
      return { data: [] };
    });
  });

  it("listens to the channel of the session user", async () => {
    const hook = renderHook(() => useRequests(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    expect(socket.state.channelName).toBe("user:prov-1");
  });

  it("adds the new request and shows the notice when the event arrives", async () => {
    const hook = renderHook(() => useRequests(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    sendEvent({ type: "incoming_services", message: "Solicita tus servicios de:", request: newRequest });

    expect(hook.result.current.getRequest("req-9")?.status).toBe("pending");
    expect(hook.result.current.currentRequest?.id).toBe("req-9");
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "incoming_services", name: "Nombre client-1", tag: "plomeria" }),
    );
  });

  it("updates the status of a request the user already had", async () => {
    sessionState.user = { id: "client-1" };
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === "/requests") return { data: [newRequest] };
      if (url === "/ratings/averages") return { data: {} };
      if (url.startsWith("/requests/current/")) return { data: null };
      return { data: [] };
    });
    const hook = renderHook(() => useRequests(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    sendEvent({ type: "request_accepted", message: "Ha aceptado tu solicitud", request: { ...newRequest, status: "accepted" } });

    expect(hook.result.current.getRequest("req-9")?.status).toBe("accepted");
    expect(hook.result.current.requests).toHaveLength(1);
  });

  it("does not show the same notice twice", async () => {
    const hook = renderHook(() => useRequests(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    const event: RequestNotificationEvent = { type: "incoming_services", message: "m", request: newRequest };
    sendEvent(event);
    sendEvent(event);

    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  it("closes the channel when the provider is unmounted", async () => {
    const hook = renderHook(() => useRequests(), { wrapper });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    hook.unmount();

    expect(socket.state.removed).toBeGreaterThan(0);
  });
});
