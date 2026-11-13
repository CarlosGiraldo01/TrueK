import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImagePicker } from "@/app/schedule/ScheduleFields";

describe("ImagePicker", () => {
  it("calls onSelect with the chosen file", async () => {
    const onSelect = vi.fn();
    render(<ImagePicker value={null} onSelect={onSelect} />);
    const file = new File(["x"], "ref.png", { type: "image/png" });

    await userEvent.upload(screen.getByLabelText("Imagen de referencia"), file);

    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it("shows Subiendo imagen... while uploading", () => {
    render(<ImagePicker value={null} onSelect={vi.fn()} isUploading />);

    expect(screen.getByText("Subiendo imagen...")).toBeTruthy();
  });

  it("does not show the uploading text by default", () => {
    render(<ImagePicker value={null} onSelect={vi.fn()} />);

    expect(screen.queryByText("Subiendo imagen...")).toBeNull();
  });

  it("renders the error in an alert", () => {
    render(<ImagePicker value={null} onSelect={vi.fn()} error="No se pudo subir la imagen." />);

    expect(screen.getByRole("alert").textContent).toBe("No se pudo subir la imagen.");
  });
});
