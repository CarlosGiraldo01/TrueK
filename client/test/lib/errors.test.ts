import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/errors";

const axiosLike = (message: unknown) =>
  Object.assign(new Error("Request failed"), { isAxiosError: true, response: { data: { message } } });

describe("getErrorMessage", () => {
  it("returns the server message of an axios error", () => {
    expect(getErrorMessage(axiosLike("Solicitud no encontrada"), "fallback")).toBe("Solicitud no encontrada");
  });

  it("returns the fallback when the server message is empty", () => {
    expect(getErrorMessage(axiosLike(""), "fallback")).toBe("fallback");
  });

  it("returns the fallback when the server message is not a string", () => {
    expect(getErrorMessage(axiosLike(42), "fallback")).toBe("fallback");
  });

  it("returns the fallback for a non-axios error", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });

  it("returns the fallback for undefined", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});
