import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreatePostPage from "@/app/feed/create/page";
import { api } from "@/lib/api";

const push = vi.hoisted(() => vi.fn());
const addPost = vi.hoisted(() => vi.fn());
const setActiveRole = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/context/SessionContext", () => ({
  useSession: () => ({ user: { id: "u1" }, activeRole: "provider", setActiveRole }),
}));
vi.mock("@/context/PostsContext", () => ({
  usePosts: () => ({ addPost, tags: ["Cocina", "Música"] }),
}));
vi.mock("@/components/ui/NavBar", () => ({ NavBar: () => null }));
vi.mock("@/hooks/useImageUpload", () => ({
  useImageUpload: () => ({
    imageUrl: null,
    previewUrl: null,
    isUploading: false,
    error: null,
    selectFile: vi.fn(),
  }),
}));

const mockedApi = vi.mocked(api, true);
const found = { latitude: 3.5, longitude: -76.7, display_name: "Tequendama, Cali, Colombia" };

const fillForm = () => {
  fireEvent.change(screen.getByLabelText("Ciudad y zona"), { target: { value: "Tequendama, Cali" } });
  fireEvent.change(screen.getByLabelText("Sobre mí"), { target: { value: "Hola" } });
  fireEvent.change(screen.getByLabelText("¿Qué vas a ofrecer?"), { target: { value: "Clases" } });
  fireEvent.change(screen.getByLabelText("¿Cuánto cobrarás por hora?"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "Cocina" }));
};

const submit = () => {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
};

describe("CreatePostPage geocoding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockReset();
    addPost.mockResolvedValue({ id: "p1" });
  });

  it("does not call geocode on mount or while typing the location", async () => {
    render(<CreatePostPage />);
    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "Tequendama");

    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("disables the search button for fewer than 3 characters", async () => {
    render(<CreatePostPage />);
    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "ab");

    expect((screen.getByRole("button", { name: "Buscar ubicación" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls geocode once when clicking the search button", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<CreatePostPage />);
    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "Tequendama");
    await userEvent.click(screen.getByRole("button", { name: "Buscar ubicación" }));

    await screen.findByText(/Tequendama, Cali, Colombia/);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });

  it("shows the location preview after a successful search", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<CreatePostPage />);
    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "Tequendama");
    await userEvent.click(screen.getByRole("button", { name: "Buscar ubicación" }));

    expect((await screen.findByText(/📍/)).textContent).toBe("📍 Tequendama, Cali, Colombia");
  });

  it("hides the preview when the location text is edited afterwards", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<CreatePostPage />);
    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "Tequendama");
    await userEvent.click(screen.getByRole("button", { name: "Buscar ubicación" }));
    await screen.findByText(/📍/);

    await userEvent.type(screen.getByLabelText("Ciudad y zona"), "x");

    expect(screen.queryByText(/📍/)).toBeNull();
  });

  it("sends the geocoded coordinates to addPost on submit", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<CreatePostPage />);
    fillForm();
    submit();

    await waitFor(() => expect(addPost).toHaveBeenCalledTimes(1));
    expect(addPost).toHaveBeenCalledWith(expect.objectContaining({ latitude: 3.5, longitude: -76.7 }));
  });

  it("does not call addPost and shows the server message when geocoding fails on submit", async () => {
    mockedApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "No se encontró esa dirección" } },
    });
    render(<CreatePostPage />);
    fillForm();
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe("No se encontró esa dirección");
    expect(addPost).not.toHaveBeenCalled();
  });

  it("reuses the resolved coordinates on submit without a second geocode call", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<CreatePostPage />);
    fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Buscar ubicación" }));
    await screen.findByText(/📍/);
    submit();

    await waitFor(() => expect(addPost).toHaveBeenCalledTimes(1));
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
