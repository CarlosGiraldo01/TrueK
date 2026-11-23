import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "@/context/ToastContext";

function ShowButton({ message, type }: { message: string; type?: "success" | "error" | "info" }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message, type)}>mostrar</button>;
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the message when showToast is called", () => {
    render(
      <ToastProvider>
        <ShowButton message="Solicitud enviada" type="success" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("mostrar").click();
    });

    expect(screen.getByRole("status")).toHaveTextContent("Solicitud enviada");
  });

  it("uses role alert for errors", () => {
    render(
      <ToastProvider>
        <ShowButton message="No se pudo" type="error" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("mostrar").click();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo");
  });

  it("hides the toast after 4 seconds", () => {
    render(
      <ToastProvider>
        <ShowButton message="Hola" />
      </ToastProvider>,
    );

    act(() => {
      screen.getByText("mostrar").click();
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Hola")).not.toBeInTheDocument();
  });

  it("throws if it is used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<ShowButton message="x" />)).toThrow("useToast must be used within a ToastProvider");
  });
});
