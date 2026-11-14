import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RequestsProvider, useRequests } from "@/context/RequestContext";
import { api } from "@/lib/api";
import type { Rating } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const sessionState = vi.hoisted(() => ({ user: { id: "client-1" } as { id: string } | null }));

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));
vi.mock("@/context/NotificationsContext", () => ({
  useNotifications: () => ({ showNotification: vi.fn() }),
}));
vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById: vi.fn() }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: vi.fn() }) }));

const mockedApi = vi.mocked(api, true);

const created: Rating = {
  id: "rt-new",
  service_request_id: "req-1",
  rated_user_id: "prov-1",
  rating: 5,
  comment: "genial",
};

const wrapper = ({ children }: { children: ReactNode }) => <RequestsProvider>{children}</RequestsProvider>;

const renderLoaded = async () => {
  const hook = renderHook(() => useRequests(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe("RequestsContext.addRating", () => {
  let averagesCalls: number;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.user = { id: "client-1" };
    averagesCalls = 0;
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === "/ratings/averages") {
        averagesCalls += 1;
        return { data: averagesCalls > 1 ? { "prov-1": 4.5 } : {} };
      }
      if (url === "/requests/current/client-1") return { data: null };
      return { data: [] };
    });
  });

  it("posts the rating with the session user and request id", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.addRating("req-1", 5, "genial");
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/ratings", {
      user_id: "client-1",
      service_request_id: "req-1",
      rating: 5,
      comment: "genial",
    });
  });

  it("returns the created rating and exposes it through getRating", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();

    let returned: Rating | undefined;
    await act(async () => {
      returned = await result.current.addRating("req-1", 5, "genial");
    });

    expect(returned).toEqual(created);
    expect(result.current.getRating("req-1")).toEqual(created);
  });

  it("refetches the averages so getUserRating reflects the new value", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();
    expect(result.current.getUserRating("prov-1")).toBe(0);

    await act(async () => {
      await result.current.addRating("req-1", 5, "genial");
    });

    expect(result.current.getUserRating("prov-1")).toBe(4.5);
  });

  it("rejects and leaves ratings unchanged when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.addRating("req-1", 5, "genial")).rejects.toThrow("boom");
    });

    expect(result.current.getRating("req-1")).toBeUndefined();
  });

  it("does not refetch averages when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.addRating("req-1", 5, "genial")).rejects.toThrow();
    });

    expect(averagesCalls).toBe(1);
  });

  it("still resolves with the rating when the averages refresh fails", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderLoaded();
    mockedApi.get.mockRejectedValue(new Error("down"));

    let returned: Rating | undefined;
    await act(async () => {
      returned = await result.current.addRating("req-1", 5, "genial");
    });

    expect(returned).toEqual(created);
  });

  it("throws without calling the api when there is no session user", async () => {
    sessionState.user = null;
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.addRating("req-1", 5, "genial")).rejects.toThrow(
        "Debes iniciar sesión para calificar",
      );
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
