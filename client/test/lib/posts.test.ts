import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { getNearbyPosts } from "@/lib/posts";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
const mockedApi = vi.mocked(api, true);

describe("getNearbyPosts", () => {
  beforeEach(() => mockedApi.get.mockReset());

  it("calls GET /posts with lat, lng and radius_km params", async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    await getNearbyPosts(3.4, -76.5, 6);
    expect(mockedApi.get).toHaveBeenCalledWith("/posts", {
      params: { lat: 3.4, lng: -76.5, radius_km: 6 },
    });
  });

  it("returns the response data", async () => {
    mockedApi.get.mockResolvedValue({ data: [{ id: "p1" }] });
    expect(await getNearbyPosts(1, 2, 3)).toEqual([{ id: "p1" }]);
  });
});
