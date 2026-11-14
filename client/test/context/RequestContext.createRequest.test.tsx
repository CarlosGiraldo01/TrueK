import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestsProvider, useRequests, type ScheduleDraft } from "@/context/RequestContext";
import { api } from "@/lib/api";
import type { ServiceRequest } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const sessionState = vi.hoisted(() => ({ user: { id: "client-1" } as { id: string } | null }));
const showNotification = vi.hoisted(() => vi.fn());

vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: sessionState.user }) }));
vi.mock("@/context/NotificationsContext", () => ({ useNotifications: () => ({ showNotification }) }));
vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById: vi.fn() }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: vi.fn() }) }));

const mockedApi = vi.mocked(api, true);

const draft: ScheduleDraft = {
  post_id: "post-1",
  client_name: "Ana",
  meeting_address: "Calle 1 # 2-3",
  hours: 2,
  date: "2030-05-10",
  time: "15:30",
  request_image: "https://img.test/ref.png",
};

const created: ServiceRequest = {
  id: "req-new",
  post_id: "post-1",
  client_id: "client-1",
  provider_id: "prov-1",
  meeting_address: "Calle 1 # 2-3",
  meeting_date: "2030-05-10T20:30:00.000Z",
  hours: 2,
  status: "pending",
  request_image: "https://img.test/ref.png",
  payment_confirmed: false,
  price: 100,
};

const wrapper = ({ children }: { children: ReactNode }) => <RequestsProvider>{children}</RequestsProvider>;

const renderWithDraft = async (value: ScheduleDraft | null = draft) => {
  const hook = renderHook(() => useRequests(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  if (value) {
    act(() => hook.result.current.saveDraft(value));
    await waitFor(() => expect(hook.result.current.quote).not.toBeNull());
  }
  return hook;
};

describe("RequestsContext.createRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.user = { id: "client-1" };
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === "/requests/quote") {
        return { data: { post_id: "post-1", provider_id: "prov-1", hours: 2, price_per_hour: 50, total: 100 } };
      }
      if (url === "/requests/current/client-1") return { data: null };
      if (url === "/ratings/averages") return { data: {} };
      return { data: [] };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("posts exactly the six allowed fields", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();

    await act(async () => {
      await result.current.createRequest();
    });

    const body = mockedApi.post.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      "hours",
      "meeting_address",
      "meeting_date",
      "post_id",
      "request_image",
      "user_id",
    ]);
  });

  it("posts the draft values to /requests with the session user", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();

    await act(async () => {
      await result.current.createRequest();
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/requests", {
      user_id: "client-1",
      post_id: "post-1",
      meeting_address: "Calle 1 # 2-3",
      // La fecha se interpreta en hora local, por eso se calcula igual y no se escribe a mano
      meeting_date: new Date("2030-05-10T15:30").toISOString(),
      hours: 2,
      request_image: "https://img.test/ref.png",
    });
  });

  it("sends a null request_image when the draft has none", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft({ ...draft, request_image: null });

    await act(async () => {
      await result.current.createRequest();
    });

    expect(mockedApi.post.mock.calls[0][1]).toMatchObject({ request_image: null });
  });

  it("returns the created request and exposes it through getRequest", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();

    let returned: ServiceRequest | undefined;
    await act(async () => {
      returned = await result.current.createRequest();
    });

    expect(returned).toEqual(created);
    expect(result.current.getRequest("req-new")).toEqual(created);
  });

  it("sets lastCreatedId to the new request id", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();

    await act(async () => {
      await result.current.createRequest();
    });

    expect(result.current.lastCreatedId).toBe("req-new");
  });

  it("clears the draft and the quote after creating", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();

    await act(async () => {
      await result.current.createRequest();
    });

    expect(result.current.draft).toBeNull();
    expect(result.current.quote).toBeNull();
  });

  it("does not queue any local notification for the created request", async () => {
    mockedApi.post.mockResolvedValue({ data: created });
    const { result } = await renderWithDraft();
    vi.useFakeTimers();

    await act(async () => {
      await result.current.createRequest();
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(showNotification).not.toHaveBeenCalled();
  });

  it("rejects and leaves requests and draft unchanged when the api fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { result } = await renderWithDraft();

    await act(async () => {
      await expect(result.current.createRequest()).rejects.toThrow("boom");
    });

    expect(result.current.requests).toEqual([]);
    expect(result.current.draft).toEqual(draft);
    expect(result.current.lastCreatedId).toBeNull();
  });

  it("throws the login message without posting when there is no session user", async () => {
    sessionState.user = null;
    const { result } = await renderWithDraft();

    await act(async () => {
      await expect(result.current.createRequest()).rejects.toThrow(
        "Debes iniciar sesión para solicitar un servicio",
      );
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("throws without posting when there is no draft", async () => {
    const { result } = await renderWithDraft(null);

    await act(async () => {
      await expect(result.current.createRequest()).rejects.toThrow("Primero completa los datos del servicio");
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("throws the date message without posting when the time is invalid", async () => {
    const { result } = await renderWithDraft({ ...draft, time: "99:99" });

    await act(async () => {
      await expect(result.current.createRequest()).rejects.toThrow("La fecha u hora del servicio no es válida");
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
