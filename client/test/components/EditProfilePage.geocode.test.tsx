import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditProfilePage from "@/app/profile/edit/page";
import { api } from "@/lib/api";
import type { User } from "@/types";

const push = vi.hoisted(() => vi.fn());
const updateUser = vi.hoisted(() => vi.fn());
const logout = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/context/SessionContext", () => ({
  useSession: () => ({ user: sessionUser, updateUser, logout }),
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

const sessionUser: User = {
  id: "u1",
  name: "Ana",
  email: "a@b.c",
  profile_picture: null,
  age: 30,
  location: "Cali",
  description: null,
  role: "client",
  latitude: null,
  longitude: null,
};

const mockedApi = vi.mocked(api, true);
const found = { latitude: 4.1, longitude: -74.2, display_name: "Bogotá, Colombia" };

const submit = () => {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
};

describe("EditProfilePage geocoding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockReset();
    updateUser.mockResolvedValue(sessionUser);
  });

  it("sends no coordinates and never calls geocode when the location is unchanged", async () => {
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nueva" } });
    submit();

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ name: "Nueva" }));
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("does not call geocode while typing a new location", async () => {
    render(<EditProfilePage />);
    await userEvent.type(screen.getByLabelText("Ubicación"), "Bogotá");

    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("geocodes on submit and sends location with latitude and longitude when the location changed", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Ubicación"), { target: { value: "Bogotá" } });
    submit();

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith({ location: "Bogotá", latitude: 4.1, longitude: -74.2 })
    );
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });

  it("does not call updateUser and shows the error when geocoding fails for a changed location", async () => {
    mockedApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "No se encontró esa dirección" } },
    });
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Ubicación"), { target: { value: "Zzzzzz" } });
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe("No se encontró esa dirección");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("sends coordinates when the location is unchanged but the user clicked search", async () => {
    mockedApi.get.mockResolvedValue({ data: found });
    render(<EditProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "Buscar ubicación" }));
    await screen.findByText(/📍/);
    submit();

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ latitude: 4.1, longitude: -74.2 }));
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
