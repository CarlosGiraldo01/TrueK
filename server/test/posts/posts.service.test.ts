import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { CreatePostInput, Post } from "../../src/features/posts/posts.types";

const postsRepository = {
  findTags: mock.fn(async (): Promise<string[]> => ["Conversar", "Música"]),
  create: mock.fn(async (_input: unknown): Promise<string> => "new-id"),
  findById: mock.fn(async (_id: string): Promise<Post | undefined> => undefined),
};
const usersService = {
  getById: mock.fn(
    async (_id: string): Promise<{ id: string; name: string } | undefined> => undefined
  ),
};

const IMG_BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";
const uploadsRepository = {
  upload: mock.fn(async (): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${IMG_BASE}${path}`),
};

mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });
mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/users/users.service", { exports: { usersService } });

let postsService: typeof import("../../src/features/posts/posts.service").postsService;

before(async () => {
  ({ postsService } = await import("../../src/features/posts/posts.service"));
});

const input: CreatePostInput = {
  user_id: "u1",
  description: "d",
  offer: "o",
  location: "l",
  latitude: 1,
  longitude: 2,
  price: 500,
  tags: ["Conversar"],
};

const OWN_ID = "123e4567-e89b-12d3-a456-426614174000";
const createdPost = { id: "new-id", user_id: "u1", name: "Valeria" } as Post;

beforeEach(() => {
  postsRepository.findTags.mock.resetCalls();
  postsRepository.create.mock.resetCalls();
  postsRepository.findById.mock.resetCalls();
  usersService.getById.mock.resetCalls();
  usersService.getById.mock.mockImplementation(async () => ({ id: "u1", name: "Valeria" }));
  postsRepository.findTags.mock.mockImplementation(async () => ["Conversar", "Música"]);
  postsRepository.findById.mock.mockImplementation(async () => createdPost);
});

const statusOf = (err: unknown): number | undefined =>
  (err as { output?: { statusCode: number } }).output?.statusCode;

test("postsService.create passes the user's name to the repository and returns the stored post", async () => {
  const result = await postsService.create(input);

  assert.equal(result, createdPost);
  assert.deepEqual(postsRepository.create.mock.calls[0].arguments[0], { ...input, name: "Valeria" });
  assert.equal(postsRepository.findById.mock.calls[0].arguments[0], "new-id");
});

test("postsService.create throws 404 when the user does not exist", async () => {
  usersService.getById.mock.mockImplementation(async () => undefined);

  await assert.rejects(postsService.create(input), (err: unknown) => {
    return statusOf(err) === 404 && (err as Error).message === "Usuario no encontrado";
  });
});

test("postsService.create throws 400 for an unknown tag and does not create", async () => {
  await assert.rejects(
    postsService.create({ ...input, tags: ["Conversar", "Falsa"] }),
    (err: unknown) =>
      statusOf(err) === 400 && (err as Error).message === "Categoría no válida: Falsa"
  );
  assert.equal(postsRepository.create.mock.callCount(), 0);
});

test("postsService.create throws 500 when the created post cannot be read back", async () => {
  postsRepository.findById.mock.mockImplementation(async () => undefined);

  await assert.rejects(postsService.create(input), (err: unknown) => statusOf(err) === 500);
});

test("postsService.create rejects a post_image from another user's folder and does not create", async () => {
  await assert.rejects(
    postsService.create({ ...input, post_image: `${IMG_BASE}other-user/a.png` }),
    (err: unknown) =>
      statusOf(err) === 400 && (err as Error).message === "La imagen no pertenece al usuario"
  );
  assert.equal(postsRepository.create.mock.callCount(), 0);
});

test("postsService.create rejects a foreign image before looking up the user", async () => {
  await assert.rejects(
    postsService.create({ ...input, post_image: "https://evil.example.com/a.png" }),
    (err: unknown) => statusOf(err) === 400
  );
  assert.equal(usersService.getById.mock.callCount(), 0);
});

test("postsService.create accepts a post_image from the user's own folder", async () => {
  const post_image = `${IMG_BASE}${OWN_ID}/11111111-1111-4111-8111-111111111111.png`;
  const result = await postsService.create({ ...input, user_id: OWN_ID, post_image });

  assert.equal(result, createdPost);
  assert.deepEqual(postsRepository.create.mock.calls[0].arguments[0], {
    ...input,
    user_id: OWN_ID,
    post_image,
    name: "Valeria",
  });
});
