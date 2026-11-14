import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useGeocode } from "@/hooks/useGeocode";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

const found = { latitude: 3.4, longitude: -76.5, display_name: "Tequendama, Cali" };

beforeEach(() => {
  mockedApi.get.mockReset();
});

describe("useGeocode", () => {
  it("does not call the api on mount", () => {
    renderHook(() => useGeocode());

    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("sets an error, skips the request and returns null for a query shorter than 3 characters", async () => {
    const { result } = renderHook(() => useGeocode());
    let returned: unknown = "unset";

    await act(async () => {
      returned = await result.current.search("ab");
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBe("Escribe al menos 3 caracteres para buscar la ubicación.");
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("sets an error and skips the request for a query longer than 200 characters", async () => {
    const { result } = renderHook(() => useGeocode());
    let returned: unknown = "unset";

    await act(async () => {
      returned = await result.current.search("a".repeat(201));
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBe("La ubicación no puede superar 200 caracteres.");
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("stores the result and the trimmed resolved query on success", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    const { result } = renderHook(() => useGeocode());

    await act(async () => {
      await result.current.search("  Tequendama  ");
    });

    expect(result.current.result).toEqual(found);
    expect(result.current.resolvedQuery).toBe("Tequendama");
    expect(mockedApi.get).toHaveBeenCalledWith("/geocode", { params: { q: "Tequendama" } });
  });

  it("is searching while the request is pending and not searching afterwards", async () => {
    let resolve: (v: { data: typeof found }) => void = () => {};
    mockedApi.get.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useGeocode());

    let promise: Promise<unknown> = Promise.resolve();
    act(() => {
      promise = result.current.search("Tequendama");
    });
    expect(result.current.isSearching).toBe(true);

    await act(async () => {
      resolve({ data: found });
      await promise;
    });
    expect(result.current.isSearching).toBe(false);
  });

  it("isResolvedFor is true for the exact resolved text", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    const { result } = renderHook(() => useGeocode());
    await act(async () => {
      await result.current.search("Tequendama");
    });

    expect(result.current.isResolvedFor("Tequendama")).toBe(true);
  });

  it("isResolvedFor ignores surrounding whitespace", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    const { result } = renderHook(() => useGeocode());
    await act(async () => {
      await result.current.search("Tequendama");
    });

    expect(result.current.isResolvedFor("  Tequendama ")).toBe(true);
  });

  it("isResolvedFor is false for different text", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    const { result } = renderHook(() => useGeocode());
    await act(async () => {
      await result.current.search("Tequendama");
    });

    expect(result.current.isResolvedFor("Tequendama 2")).toBe(false);
  });

  it("uses the server message as error and clears the result when the request fails", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: found });
    const { result } = renderHook(() => useGeocode());
    await act(async () => {
      await result.current.search("Tequendama");
    });
    mockedApi.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: "No se encontró esa dirección" } },
    });

    await act(async () => {
      await result.current.search("Nowhere land");
    });

    expect(result.current.error).toBe("No se encontró esa dirección");
    expect(result.current.result).toBeNull();
  });

  it("uses the generic message for a non-axios failure", async () => {
    mockedApi.get.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useGeocode());

    await act(async () => {
      await result.current.search("Tequendama");
    });

    expect(result.current.error).toBe("No se pudo buscar la ubicación. Intenta de nuevo.");
  });

  it("ignores a stale response that resolves after a newer search", async () => {
    const resolvers: Array<(v: { data: typeof found }) => void> = [];
    mockedApi.get.mockImplementation(
      () => new Promise((r) => { resolvers.push(r); })
    );
    const { result } = renderHook(() => useGeocode());
    const resultB = { latitude: 9, longitude: 9, display_name: "B" };

    let pA: Promise<unknown> = Promise.resolve();
    let pB: Promise<unknown> = Promise.resolve();
    act(() => {
      pA = result.current.search("Lugar A");
    });
    act(() => {
      pB = result.current.search("Lugar B");
    });
    await act(async () => {
      resolvers[1]({ data: resultB });
      await pB;
      resolvers[0]({ data: found });
      await pA;
    });

    expect(result.current.result).toEqual(resultB);
  });

  it("reset clears result, resolved query and error", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    const { result } = renderHook(() => useGeocode());
    await act(async () => {
      await result.current.search("Tequendama");
    });

    act(() => result.current.reset());

    expect(result.current.result).toBeNull();
    expect(result.current.resolvedQuery).toBeNull();
  });
});
