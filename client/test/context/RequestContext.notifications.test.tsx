import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestsProvider, useRequests } from "@/context/RequestContext";
import { api } from "@/lib/api";
import type { Notification, ServiceRequest } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

interface FakeUser {
  id: string;
  name: string;
  profile_picture: string | null;
}

const sessionState = vi.hoisted(() => ({ user: { id: "client-1" } as { id: string } | null }));
const showNotification = vi.hoisted(() => vi.fn());
const usersState = vi.hoisted(() => ({
  getUserById: ((id: string) => ({ id, name: `Nombre ${id}`, profile_picture: null })) as (
    id: string,
  ) => FakeUser | undefined,
}));
const getPostById = vi.hoisted(() => vi.fn());

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));
vi.mock("@/context/NotificationsContext", () => ({ useNotifications: () => ({ showNotification }) }));
vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: usersState.getUserById }) }));

const mockedApi = vi.mocked(api, true);

const baseRequest: ServiceRequest = {
  id: "req-1",
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

const setup = (request: ServiceRequest, notifications: Notification[]) => {
  mockedApi.get.mockImplementation(async (url: string) => {
    if (url === "/requests") return { data: [request] };
    if (url === "/notifications") return { data: notifications };
    if (url === "/ratings/averages") return { data: {} };
    if (url.startsWith("/requests/current/")) return { data: null };
    return { data: [] };
  });
};

const notif = (type: Notification["type"], id = "n-1"): Notification => ({
  id,
  user_id: "client-1",
  service_request_id: "req-1",
  type,
  message: "m",
});

const renderAndWait = async () => {
  const hook = renderHook(() => useRequests(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  return hook;
};

describe("RequestsContext notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionState.user = { id: "client-1" };
    usersState.getUserById = (id) => ({ id, name: `Nombre ${id}`, profile_picture: null });
    getPostById.mockReturnValue({ tags: ["plomeria"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the notifications of the session user without a type filter", async () => {
    setup(baseRequest, []);
    await renderAndWait();

    expect(mockedApi.get).toHaveBeenCalledWith("/notifications", { params: { user_id: "client-1" } });
  });

  it("shows a request_accepted notice when the request is accepted", async () => {
    setup({ ...baseRequest, status: "accepted" }, [notif("request_accepted")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  it("does not show a request_accepted notice while the request is still pending", async () => {
    setup(baseRequest, [notif("request_accepted")]);
    await renderAndWait();

    expect(showNotification).not.toHaveBeenCalled();
  });

  it("does not show services_finished when the payment is already confirmed", async () => {
    setup({ ...baseRequest, status: "finished", payment_confirmed: true }, [notif("services_finished")]);
    await renderAndWait();

    expect(showNotification).not.toHaveBeenCalled();
  });

  it("does not show the same notification id twice across a re-render", async () => {
    setup({ ...baseRequest, status: "accepted" }, [notif("request_accepted")]);
    const hook = await renderAndWait();

    usersState.getUserById = () => undefined; // new identity re-runs the effect
    hook.rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  it("shows the client name and the plain request link to a provider receiving services_finished", async () => {
    sessionState.user = { id: "prov-1" };
    setup({ ...baseRequest, status: "finished" }, [notif("services_finished")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledWith({
      type: "services_finished",
      name: "Nombre client-1",
      avatarUrl: undefined,
      tag: undefined,
      href: "/requests/req-1",
    });
  });

  it("shows the provider name and the rating link to a client receiving services_finished", async () => {
    setup({ ...baseRequest, status: "finished" }, [notif("services_finished")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledWith({
      type: "services_finished",
      name: "Nombre prov-1",
      avatarUrl: undefined,
      tag: undefined,
      href: "/requests/req-1/rating",
    });
  });

  it("adds the post tag only for incoming_services", async () => {
    sessionState.user = { id: "prov-1" };
    setup(baseRequest, [notif("incoming_services")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tag: "plomeria", name: "Nombre client-1" }),
    );
  });

  it("falls back to Prestador for a client when the provider is unknown", async () => {
    usersState.getUserById = () => undefined;
    setup({ ...baseRequest, status: "accepted" }, [notif("request_accepted")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ name: "Prestador" }));
  });

  it("falls back to Cliente for a provider when the client is unknown", async () => {
    sessionState.user = { id: "prov-1" };
    usersState.getUserById = () => undefined;
    setup(baseRequest, [notif("incoming_services")]);
    await renderAndWait();

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ name: "Cliente" }));
  });
});
