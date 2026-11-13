import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { StarRating } from "@/components/ui/StarRating";

test("StarRating calls onChange with the star the user clicks", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<StarRating value={2} onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: "4 estrellas" }));

  expect(onChange).toHaveBeenCalledWith(4);
});

test("StarRating is read-only when no onChange is provided", () => {
  render(<StarRating value={3} />);

  expect(screen.queryAllByRole("button")).toHaveLength(0);
});

test("StarRating shows the numeric value when showValue is set and it is read-only", () => {
  render(<StarRating value={4.25} showValue />);

  expect(screen.getByText("4.3")).toBeInTheDocument();
});

test("StarRating hides the numeric value when it is interactive, even with showValue", () => {
  render(<StarRating value={4.25} showValue onChange={vi.fn()} />);

  expect(screen.queryByText("4.3")).not.toBeInTheDocument();
});
