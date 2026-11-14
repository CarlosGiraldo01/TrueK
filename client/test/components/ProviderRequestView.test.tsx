import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderRequestView } from "@/app/requests/[requestId]/ProviderRequestView";
import { ActiveServiceView } from "@/app/requests/[requestId]/ActiveServiceView";
import type { ServiceRequest } from "@/types";

const push = vi.hoisted(() => vi.fn());
const acceptRequest = vi.hoisted(() => vi.fn());
const rejectRequest = vi.hoisted(() => vi.fn());
const finishRequest = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/context/RequestContext", () => ({
  useRequests: () => ({ acceptRequest, rejectRequest, finishRequest }),
}));
vi.mock("@/app/requests/[requestId]/ServiceDetailCard", () => ({
  ServiceDetailCard: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  StatusBadge: () => null,
}));

const request: ServiceRequest = {
  id: "req-1",
  post_id: "post-1",
  client_id: "client-1",
  provider_id: "prov-1",
  meeting_address: "Calle 1",
  meeting_date: "2030-05-10T20:30:00.000Z",
  hours: 2,
  status: "pending",
  request_image: null,
  payment_confirmed: false,
  price: 100,
};

const axiosLikeError = (message: string) =>
  Object.assign(new Error("Request failed"), { isAxiosError: true, response: { data: { message } } });

const renderProvider = () => render(<ProviderRequestView request={request} client={undefined} imageUrl="" />);

describe("ProviderRequestView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls acceptRequest with the request id when Aceptar is clicked", async () => {
    acceptRequest.mockResolvedValue(undefined);
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect(acceptRequest).toHaveBeenCalledWith("req-1");
  });

  it("disables both buttons while the action is pending", async () => {
    acceptRequest.mockReturnValue(new Promise(() => {}));
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    const disabled = screen.getAllByRole("button").map((b) => (b as HTMLButtonElement).disabled);
    expect(disabled).toEqual([true, true]);
  });

  it("shows the server message in an alert when accepting fails", async () => {
    acceptRequest.mockRejectedValue(axiosLikeError("Solo el prestador puede aceptar o rechazar"));
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Solo el prestador puede aceptar o rechazar");
  });

  it("shows the generic message for a non-axios error", async () => {
    acceptRequest.mockRejectedValue(new Error("boom"));
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudo actualizar la solicitud. Intenta de nuevo.",
    );
  });

  it("navigates to /requests after rejecting successfully", async () => {
    rejectRequest.mockResolvedValue(undefined);
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Rechazar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/requests"));
  });

  it("does not navigate when rejecting fails", async () => {
    rejectRequest.mockRejectedValue(axiosLikeError("Solicitud ya respondida"));
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "Rechazar" }));

    await screen.findByRole("alert");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("ActiveServiceView finish button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderActive = () =>
    render(
      <ActiveServiceView request={{ ...request, status: "accepted" }} person={undefined} role="provider" imageUrl="" />,
    );

  it("calls finishRequest with the request id", async () => {
    finishRequest.mockReturnValue(new Promise(() => {}));
    renderActive();
    await userEvent.click(screen.getByRole("button", { name: "Dar por finalizado" }));

    expect(finishRequest).toHaveBeenCalledWith("req-1");
  });

  it("disables the finish button while pending", async () => {
    finishRequest.mockReturnValue(new Promise(() => {}));
    renderActive();
    await userEvent.click(screen.getByRole("button", { name: "Dar por finalizado" }));

    expect((screen.getByRole("button", { name: "Dar por finalizado" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the server message in an alert when finishing fails", async () => {
    finishRequest.mockRejectedValue(axiosLikeError("La solicitud no está activa"));
    renderActive();
    await userEvent.click(screen.getByRole("button", { name: "Dar por finalizado" }));

    expect((await screen.findByRole("alert")).textContent).toBe("La solicitud no está activa");
  });
});
