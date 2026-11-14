import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SchedulePage from "@/app/schedule/[postId]/page";
import type { Post } from "@/types";

const push = vi.hoisted(() => vi.fn());
const saveDraft = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => ({
  imageUrl: null as string | null,
  previewUrl: null as string | null,
  isUploading: false,
  error: null as string | null,
  selectFile: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  notFound: () => {
    throw new Error("not found");
  },
}));
vi.mock("@/components/ui/NavBar", () => ({ NavBar: () => null }));
vi.mock("@/hooks/useImageUpload", () => ({ useImageUpload: () => upload }));
vi.mock("@/context/SessionContext", () => ({ useSession: () => ({ user: { id: "client-1", name: "Ana" } }) }));
vi.mock("@/context/RequestContext", () => ({ useRequests: () => ({ draft: null, saveDraft }) }));

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

const params = Object.assign(Promise.resolve({ postId: "post-1" }), {
  status: "fulfilled" as const,
  value: { postId: "post-1" },
});

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText("Dirección de encuentro"), "Calle 1");
  fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2030-05-10" } });
  await userEvent.selectOptions(screen.getByLabelText("Hora"), "15:00");
};

const pickImage = async () => {
  await userEvent.upload(
    screen.getByLabelText("Imagen de referencia"),
    new File(["x"], "ref.png", { type: "image/png" }),
  );
};

describe("SchedulePage image upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.imageUrl = null;
    upload.previewUrl = null;
    upload.isUploading = false;
    upload.error = null;
  });

  it("forwards the chosen file to the upload hook", async () => {
    render(<SchedulePage params={params} />);
    await pickImage();

    expect(upload.selectFile).toHaveBeenCalledTimes(1);
  });

  it("saves the uploaded https url in the draft, not the blob preview", async () => {
    upload.imageUrl = "https://storage.test/ref.png";
    upload.previewUrl = "blob:http://localhost/abc";
    render(<SchedulePage params={params} />);
    await pickImage();
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ request_image: "https://storage.test/ref.png" }),
    );
  });

  it("disables Continuar while the image is uploading", () => {
    upload.isUploading = true;
    render(<SchedulePage params={params} />);

    expect((screen.getByRole("button", { name: "Continuar" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not save the draft while the image is uploading", async () => {
    upload.isUploading = true;
    render(<SchedulePage params={params} />);
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(saveDraft).not.toHaveBeenCalled();
  });
});
