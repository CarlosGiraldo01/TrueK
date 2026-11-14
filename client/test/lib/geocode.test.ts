import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { geocodeAddress } from "@/lib/geocode";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

beforeEach(() => {
  mockedApi.get.mockReset();
});

describe("geocodeAddress", () => {
  it("calls GET /geocode with the query as param", async () => {
    mockedApi.get.mockResolvedValue({ data: { latitude: 1, longitude: 2, display_name: "X" } });

    await geocodeAddress("Tequendama, Cali");

    expect(mockedApi.get).toHaveBeenCalledWith("/geocode", { params: { q: "Tequendama, Cali" } });
  });

  it("returns the response data", async () => {
    const data = { latitude: 3.4, longitude: -76.5, display_name: "Tequendama, Cali" };
    mockedApi.get.mockResolvedValue({ data });

    expect(await geocodeAddress("Tequendama")).toEqual(data);
  });
});
