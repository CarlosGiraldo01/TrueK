import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostsProvider, usePosts } from "@/context/PostsContext";
import { api } from "@/lib/api";
import type { CreatePostInput, Post } from "@/types";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

const makePost = (id: string): Post => ({
  id,
  user_id: "u1",
  name: "Valeria",
  description: `desc ${id}`,
  tags: ["Conversar"],
  location: "Medellín",
  latitude: 1,
  longitude: 2,
  post_image: null,
  created_at: "2026-01-01T00:00:00Z",
});

const input: CreatePostInput = {
  user_id: "u1",
  description: "nueva",
  offer: "algo",
  location: "Medellín",
  latitude: 1,
  longitude: 2,
  price: 500,
  tags: ["Conversar"],
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PostsProvider>{children}</PostsProvider>
);

const renderLoaded = async () => {
  const hook = renderHook(() => usePosts(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

describe("PostsContext.addPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockImplementation(async (url: string) =>
      url === "/posts"
        ? { data: [makePost("old")] }
        : { data: ["Conversar"] }
    );
  });

  it("posts the input and puts the server post first", async () => {
    mockedApi.post.mockResolvedValue({ data: makePost("new") });
    const { result } = await renderLoaded();

    let returned: Post | undefined;
    await act(async () => {
      returned = await result.current.addPost(input);
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/posts", input);
    expect(returned?.id).toBe("new");
    expect(result.current.posts.map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("rejects and leaves posts unchanged when the request fails", async () => {
    mockedApi.post.mockRejectedValue(new Error("boom"));
    const { result } = await renderLoaded();

    await act(async () => {
      await expect(result.current.addPost(input)).rejects.toThrow("boom");
    });

    expect(result.current.posts.map((p) => p.id)).toEqual(["old"]);
  });
});
