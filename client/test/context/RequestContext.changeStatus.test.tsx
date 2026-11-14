import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestsProvider, useRequests } from "@/context/RequestContext";
import { api } from "@/lib/api";
import type { ServiceRequest } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const sessionState = vi.hoisted(() => ({ user: { id: "prov-1" } as { id: string } | null }));

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));
vi.mock("@/context/NotificationsContext", () => ({ useNotifications: () => ({ showNotification: vi.fn() }) }));
vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById: vi.fn() }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: vi.fn() }) }));

const mockedApi = vi.mocked(api, true);

const pending: ServiceRequest = {
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

const renderLoaded = async () => {
  const hook = renderHook(() => useRequests(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe("RequestsContext accept/reject/finish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.user = { id: "prov-1" };
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === "/requests") return { data: [pending] };
      if (url === "/ratings/averages") return { data: {} };
      if (url.startsWith("/requests/current/")) return { data: null };
      return { data: [] };
    });
  });

  it("acceptRequest patches the request with the user id and the accept action only", async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...pending, status: "accepted" } });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.acceptRequest("req-1");
    });

    expect(mockedApi.patch.mock.calls).toEqual([["/requests/req-1", { user_id: "prov-1", action: "accept" }]]);
  });

  it("replaces the request with the server response after accepting", async () => {
    const accepted = { ...pending, status: "accepted" as const };
    mockedApi.patch.mockResolvedValue({ data: accepted });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.acceptRequest("req-1");
    });

    expect(result.current.getRequest("req-1")).toEqual(accepted);
  });

  it("rejectRequest sends the reject action", async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...pending, status: "rejected" } });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.rejectRequest("req-1");
    });

    expect(mockedApi.patch).toHaveBeenCalledWith("/requests/req-1", { user_id: "prov-1", action: "reject" });
  });

  it("finishRequest sends the finish action", async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...pending, status: "finished" } });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.finishRequest("req-1");
    });

    expect(mockedApi.patch).toHaveBeenCalledWith("/requests/req-1", { user_id: "prov-1", action: "finish" });
  });

  it("rejects and leaves the request unchanged when the api fails", async () => {
    mockedApi.patch.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.acceptRequest("req-1")).rejects.toThrow("boom");
    });

    expect(result.current.getRequest("req-1")).toEqual(pending);
  });

  it("throws without calling the api when there is no session user", async () => {
    sessionState.user = null;
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.acceptRequest("req-1")).rejects.toThrow("Debes iniciar sesión");
    });

    expect(mockedApi.patch).not.toHaveBeenCalled();
  });

  it("never calls the old GET /requests/transition endpoint", async () => {
    mockedApi.patch.mockResolvedValue({ data: { ...pending, status: "accepted" } });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.acceptRequest("req-1");
    });

    const urls = mockedApi.get.mock.calls.map((call) => call[0]);
    expect(urls).not.toContain("/requests/transition");
  });
});
