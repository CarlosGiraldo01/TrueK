import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { useImageUpload } from "@/hooks/useImageUpload";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

const png = (size = 10): File => new File([new Uint8Array(size)], "a.png", { type: "image/png" });

beforeEach(() => {
  mockedApi.post.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useImageUpload", () => {
  it("sets an error and does not upload for an invalid type", async () => {
    const { result } = renderHook(() => useImageUpload("u1"));

    await act(() => result.current.selectFile(new File(["x"], "a.gif", { type: "image/gif" })));

    expect(result.current.error).toBe("Solo se permiten imágenes png, jpeg o webp.");
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("sets an error and does not upload for a file over 5 MB", async () => {
    const { result } = renderHook(() => useImageUpload("u1"));

    await act(() => result.current.selectFile(png(5 * 1024 * 1024 + 1)));

    expect(result.current.error).toBe("La imagen supera el tamaño máximo de 5 MB.");
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("sets an error and does not upload without a userId", async () => {
    const { result } = renderHook(() => useImageUpload(null));

    await act(() => result.current.selectFile(png()));

    expect(result.current.error).toBe("Debes iniciar sesión para subir una imagen.");
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("is uploading while the request is pending", async () => {
    mockedApi.post.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useImageUpload("u1"));

    act(() => {
      void result.current.selectFile(png());
    });

    await waitFor(() => expect(result.current.isUploading).toBe(true));
  });

  it("sets imageUrl from the response and keeps a preview", async () => {
    mockedApi.post.mockResolvedValue({ data: { url: "https://cdn/x.png", path: "u1/x.png" } });
    const { result } = renderHook(() => useImageUpload("u1"));

    await act(() => result.current.selectFile(png()));

    expect(result.current.imageUrl).toBe("https://cdn/x.png");
    expect(result.current.previewUrl).toBe("blob:preview");
    expect(result.current.isUploading).toBe(false);
  });

  it("shows the server message and leaves imageUrl null when the upload fails", async () => {
    const error = new AxiosError("fail", "ERR_BAD_RESPONSE", undefined, undefined, {
      data: { message: "La imagen supera el tamaño máximo de 5 MB" },
      status: 413,
    } as AxiosResponse);
    mockedApi.post.mockRejectedValue(error);
    const { result } = renderHook(() => useImageUpload("u1"));

    await act(() => result.current.selectFile(png()));

    expect(result.current.error).toBe("La imagen supera el tamaño máximo de 5 MB");
    expect(result.current.imageUrl).toBeNull();
  });

  it("clear resets imageUrl, preview and error", async () => {
    mockedApi.post.mockResolvedValue({ data: { url: "https://cdn/x.png", path: "p" } });
    const { result } = renderHook(() => useImageUpload("u1"));
    await act(() => result.current.selectFile(png()));

    act(() => result.current.clear());

    expect(result.current.imageUrl).toBeNull();
    expect(result.current.previewUrl).toBeNull();
  });
});
