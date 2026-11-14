import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "@/hooks/useGeolocation";

type Success = (pos: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (err: { code: number }) => void;

const original = Object.getOwnPropertyDescriptor(navigator, "geolocation");
let onSuccess: Success = () => {};
let onError: Failure = () => {};
const watchPosition = vi.fn();
const clearWatch = vi.fn();

const setGeolocation = (value: unknown) =>
  Object.defineProperty(navigator, "geolocation", { value, configurable: true });

beforeEach(() => {
  watchPosition.mockReset();
  clearWatch.mockReset();
  watchPosition.mockImplementation((s: Success, e: Failure) => {
    onSuccess = s;
    onError = e;
    return 42;
  });
  setGeolocation({ watchPosition, clearWatch });
});

afterEach(() => {
  cleanup();
  if (original) Object.defineProperty(navigator, "geolocation", original);
  else Reflect.deleteProperty(navigator, "geolocation");
});

describe("useGeolocation", () => {
  it("reports an error and not loading when geolocation is unsupported", () => {
    Reflect.deleteProperty(navigator, "geolocation");
    const { result } = renderHook(() => useGeolocation());
    expect(result.current).toEqual({
      position: null,
      error: "Tu navegador no permite obtener la ubicación",
      isLoading: false,
    });
  });

  it("is loading with no position before the first fix", () => {
    const { result } = renderHook(() => useGeolocation());
    expect(result.current).toEqual({ position: null, error: null, isLoading: true });
  });

  it("sets the position and stops loading on success", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => onSuccess({ coords: { latitude: 3.4, longitude: -76.5 } }));
    expect(result.current).toEqual({
      position: { latitude: 3.4, longitude: -76.5 },
      error: null,
      isLoading: false,
    });
  });

  it.each([
    [1, "No diste permiso para usar tu ubicación"],
    [2, "No se pudo determinar tu ubicación"],
    [3, "Se agotó el tiempo para obtener tu ubicación"],
  ])("maps error code %i to its message", (code, message) => {
    const { result } = renderHook(() => useGeolocation());
    act(() => onError({ code }));
    expect(result.current).toEqual({ position: null, error: message, isLoading: false });
  });

  it("clears the error when a later position arrives", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => onError({ code: 3 }));
    act(() => onSuccess({ coords: { latitude: 1, longitude: 2 } }));
    expect(result.current.error).toBeNull();
  });

  it("passes the expected options to watchPosition", () => {
    renderHook(() => useGeolocation());
    expect(watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 10000,
    });
  });

  it("clears the watch on unmount", () => {
    const { unmount } = renderHook(() => useGeolocation());
    unmount();
    expect(clearWatch).toHaveBeenCalledWith(42);
  });
});
