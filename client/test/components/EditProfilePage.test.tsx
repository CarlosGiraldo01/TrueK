import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditProfilePage from "@/app/profile/edit/page";
import type { User } from "@/types";

const push = vi.hoisted(() => vi.fn());
const updateUser = vi.hoisted(() => vi.fn());
const logout = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ user: null as User | null }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/context/SessionContext", () => ({
  useSession: () => ({ user: session.user, updateUser, logout }),
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

const user: User = {
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

const submit = () => {
  const form = document.querySelector("form");
  if (!form) throw new Error("form not found");
  // fireEvent.submit evita la validación nativa de jsdom (min/max del input) para probar la nuestra
  fireEvent.submit(form);
};

describe("EditProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.user = user;
    updateUser.mockResolvedValue(user);
  });

  it("shows an error and does not call updateUser when the age is 17", async () => {
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Edad"), { target: { value: "17" } });
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe("La edad debe estar entre 18 y 120.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("sends only the changed field when only the name changes", async () => {
    render(<EditProfilePage />);
    const name = screen.getByLabelText("Nombre");
    await userEvent.clear(name);
    await userEvent.type(name, "Nueva");
    submit();

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ name: "Nueva" }));
  });

  it("navigates to the profile after a successful save", async () => {
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nueva" } });
    submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
  });

  it("navigates without calling updateUser when nothing changed", async () => {
    render(<EditProfilePage />);
    submit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("shows the server error message in an alert", async () => {
    const response = { data: { message: "Campo no editable: role" }, status: 400 } as AxiosResponse;
    updateUser.mockRejectedValue(new AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, response));
    render(<EditProfilePage />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nueva" } });
    submit();

    expect((await screen.findByRole("alert")).textContent).toBe("Campo no editable: role");
    expect(push).not.toHaveBeenCalled();
  });
});
