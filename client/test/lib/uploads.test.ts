import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { uploadImage, validateImageFile } from "@/lib/uploads";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

const fileOf = (type: string, size = 10): File =>
  new File([new Uint8Array(size)], "x", { type });

describe("validateImageFile", () => {
  it("accepts png, jpeg and webp", () => {
    expect(validateImageFile(fileOf("image/png"))).toBeNull();
    expect(validateImageFile(fileOf("image/jpeg"))).toBeNull();
    expect(validateImageFile(fileOf("image/webp"))).toBeNull();
  });

  it("rejects a gif", () => {
    expect(validateImageFile(fileOf("image/gif"))).toBe(
      "Solo se permiten imágenes png, jpeg o webp."
    );
  });

  it("rejects a file over 5 MB", () => {
    expect(validateImageFile(fileOf("image/png", 5 * 1024 * 1024 + 1))).toBe(
      "La imagen supera el tamaño máximo de 5 MB."
    );
  });

  it("accepts a file of exactly 5 MB", () => {
    expect(validateImageFile(fileOf("image/png", 5 * 1024 * 1024))).toBeNull();
  });
});

describe("uploadImage", () => {
  beforeEach(() => {
    mockedApi.post.mockReset();
    mockedApi.post.mockResolvedValue({ data: { url: "u", path: "p" } });
  });

  it("returns the response data", async () => {
    expect(await uploadImage(fileOf("image/png"), "user-1")).toEqual({ url: "u", path: "p" });
  });

  it("posts to /uploads/images with user_id as a query param", async () => {
    await uploadImage(fileOf("image/png"), "user-1");

    expect(mockedApi.post).toHaveBeenCalledWith("/uploads/images", expect.any(FormData), {
      params: { user_id: "user-1" },
    });
  });

  it("sends the file in the form field 'file'", async () => {
    const file = fileOf("image/png");
    await uploadImage(file, "user-1");

    const body = mockedApi.post.mock.calls[0][1] as FormData;
    expect((body.get("file") as File).type).toBe("image/png");
  });

  it("does not set a Content-Type header", async () => {
    await uploadImage(fileOf("image/png"), "user-1");

    const config = mockedApi.post.mock.calls[0][2] as Record<string, unknown>;
    expect(config.headers).toBeUndefined();
  });
});
