import { StrictMode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNearbyPosts } from "@/lib/posts";
import { useNearbyPosts } from "@/hooks/useNearbyPosts";
import type { Post } from "@/types";

vi.mock("@/lib/posts", () => ({ getNearbyPosts: vi.fn() }));
const mocked = vi.mocked(getNearbyPosts);

const post = (id: string) => ({ id }) as unknown as Post;
const base = { latitude: 3.4516, longitude: -76.532 };
// 0.001 deg lat ~ 111 m ; 0.0045 deg ~ 500 m
const at = (dLat: number) => ({ latitude: base.latitude + dLat, longitude: base.longitude });

beforeEach(() => {
  mocked.mockReset();
  mocked.mockResolvedValue([]);
});

describe("useNearbyPosts", () => {
  it("does not fetch while the center is null", () => {
    renderHook(() => useNearbyPosts(null, 6));
    expect(mocked).not.toHaveBeenCalled();
  });

  it("fetches for the first center and returns the posts", async () => {
    mocked.mockResolvedValue([post("a")]);
    const { result } = renderHook(() => useNearbyPosts(base, 6));
    await waitFor(() => expect(result.current.posts).toEqual([post("a")]));
    expect(mocked).toHaveBeenCalledWith(base.latitude, base.longitude, 6);
  });

  it("does not refetch when the center moves about 100 m", async () => {
    const { result, rerender } = renderHook(({ c }) => useNearbyPosts(c, 6), {
      initialProps: { c: base },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ c: at(0.0009) });
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it("refetches when the center moves about 500 m", async () => {
    const { result, rerender } = renderHook(({ c }) => useNearbyPosts(c, 6), {
      initialProps: { c: base },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ c: at(0.0045) });
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(2));
  });

  it("refetches when the radius changes", async () => {
    const { result, rerender } = renderHook(({ r }) => useNearbyPosts(base, r), {
      initialProps: { r: 6 },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender({ r: 10 });
    await waitFor(() => expect(mocked).toHaveBeenLastCalledWith(base.latitude, base.longitude, 10));
  });

  it("ignores a stale response that resolves after a newer one", async () => {
    const resolvers: Array<(p: Post[]) => void> = [];
    mocked.mockImplementation(() => new Promise<Post[]>((r) => resolvers.push(r)));
    const { result, rerender } = renderHook(({ c }) => useNearbyPosts(c, 6), {
      initialProps: { c: base },
    });
    rerender({ c: at(0.0045) });
    await waitFor(() => expect(resolvers).toHaveLength(2));
    await act(async () => {
      resolvers[1]([post("new")]);
    });
    await act(async () => {
      resolvers[0]([post("old")]);
    });
    expect(result.current.posts).toEqual([post("new")]);
  });

  it("returns the fallback error message when the request fails", async () => {
    mocked.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useNearbyPosts(base, 6));
    await waitFor(() => expect(result.current.error).toBe("No se pudieron cargar los servicios cercanos"));
  });

  it("retries on the next center change after a failure", async () => {
    mocked.mockRejectedValueOnce(new Error("boom"));
    const { result, rerender } = renderHook(({ c }) => useNearbyPosts(c, 6), {
      initialProps: { c: base },
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    mocked.mockResolvedValue([post("ok")]);
    rerender({ c: at(0.0009) });
    await waitFor(() => expect(result.current.posts).toEqual([post("ok")]));
    expect(result.current.error).toBeNull();
  });
});

describe("useNearbyPosts under React StrictMode", () => {
  it("loads the posts after the mount, cleanup and re-mount cycle", async () => {
    mocked.mockResolvedValue([post("a")]);
    const { result } = renderHook(() => useNearbyPosts(base, 6), { wrapper: StrictMode });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.posts).toEqual([post("a")]);
  });

  it("does not refetch for a center change under 0.3 km after loading", async () => {
    mocked.mockResolvedValue([post("a")]);
    const { result, rerender } = renderHook(({ c }) => useNearbyPosts(c, 6), {
      wrapper: StrictMode,
      initialProps: { c: base },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const callsAfterLoad = mocked.mock.calls.length;
    rerender({ c: { latitude: base.latitude + 0.0009, longitude: base.longitude } });
    expect(mocked).toHaveBeenCalledTimes(callsAfterLoad);
  });
});
