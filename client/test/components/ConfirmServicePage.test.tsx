import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmServicePage from "@/app/schedule/[postId]/confirm/page";
import type { Post, Quote } from "@/types";

const replace = vi.hoisted(() => vi.fn());
const createRequest = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  notFound: () => {
    throw new Error("not found");
  },
}));
vi.mock("@/components/ui/NavBar", () => ({ NavBar: () => null }));

const quote: Quote = { post_id: "post-1", provider_id: "prov-1", hours: 2, price_per_hour: 50, total: 100 };

vi.mock("@/context/RequestContext", () => ({
  useRequests: () => ({
    draft: {
      post_id: "post-1",
      client_name: "Ana",
      meeting_address: "Calle 1",
      hours: 2,
      date: "2030-05-10",
      time: "15:30",
      request_image: null,
    },
    createRequest,
    quote,
    quoteLoading: false,
    quoteError: null,
  }),
}));

const post: Post = {
  id: "post-1",
  user_id: "prov-1",
  name: "Plomero",
  description: "d",
  tags: ["plomeria"],
  location: "Cali",
  latitude: 0,
  longitude: 0,
  post_image: null,
  created_at: "2030-01-01",
};

vi.mock("@/context/PostsContext", () => ({ usePosts: () => ({ getPostById: () => post }) }));
vi.mock("@/context/UsersContext", () => ({ useUsers: () => ({ getUserById: () => undefined }) }));

// React.use() lee las promesas ya resueltas sin suspender
const params = Object.assign(Promise.resolve({ postId: "post-1" }), {
  status: "fulfilled" as const,
  value: { postId: "post-1" },
});

const axiosLikeError = (message: string) =>
  Object.assign(new Error("Request failed"), { isAxiosError: true, response: { data: { message } } });

describe("ConfirmServicePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to the success page after the request is created", async () => {
    createRequest.mockResolvedValue({ id: "req-1" });
    render(<ConfirmServicePage params={params} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/schedule/post-1/success"));
  });

  it("disables the button and shows Enviando... while the request is pending", async () => {
    createRequest.mockReturnValue(new Promise(() => {}));
    render(<ConfirmServicePage params={params} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    const button = await screen.findByRole("button", { name: "Enviando..." });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the server message in an alert when the api returns an error", async () => {
    createRequest.mockRejectedValue(axiosLikeError("No puedes solicitar tu propio servicio"));
    render(<ConfirmServicePage params={params} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect((await screen.findByRole("alert")).textContent).toBe("No puedes solicitar tu propio servicio");
  });

  it("re-enables the button and does not navigate after an error", async () => {
    createRequest.mockRejectedValue(axiosLikeError("No puedes solicitar tu propio servicio"));
    render(<ConfirmServicePage params={params} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    const button = await screen.findByRole("button", { name: "Confirmar" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows the generic message for a non-axios error", async () => {
    createRequest.mockRejectedValue(new Error("boom"));
    render(<ConfirmServicePage params={params} />);
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudo crear la solicitud. Intenta de nuevo.",
    );
  });
});
