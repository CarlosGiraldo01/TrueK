import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const postsRepository = {
  findAll: mock.fn(async (): Promise<Post[]> => []),
  findById: mock.fn(async (_id: string): Promise<Post | undefined> => undefined),
  findTags: mock.fn(async (): Promise<string[]> => ["Conversar"]),
  create: mock.fn(async (_input: unknown): Promise<string> => "new-id"),
};
const usersService = {
  getAll: mock.fn(async () => []),
  getById: mock.fn(async (_id: string) => ({ id: "x", name: "Valeria" })),
};

const IMG_BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";
const uploadsRepository = {
  upload: mock.fn(async (): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${IMG_BASE}${path}`),
};

mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });
mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/users/users.service", { exports: { usersService } });

const USER_ID = "123e4567-e89b-12d3-a456-426614174000";
const created = { id: "new-id", user_id: USER_ID, name: "Valeria", description: "d" } as Post;

let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await import("../../src/app");
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  postsRepository.create.mock.resetCalls();
  postsRepository.findById.mock.mockImplementation(async () => created);
});

const validBody = {
  user_id: USER_ID,
  description: "d",
  offer: "o",
  location: "l",
  latitude: 1,
  longitude: 2,
  price: 500,
  tags: ["Conversar"],
};

const post = (body: unknown): Promise<Response> =>
  fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("POST /posts responds 201 with the created post", async () => {
  const res = await post(validBody);

  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), created);
});

test("POST /posts responds 400 Falta user_id when user_id is missing", async () => {
  const { user_id: _omit, ...rest } = validBody;
  const res = await post(rest);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "Falta user_id",
  });
});

test("POST /posts responds 400 with the field message when description is missing", async () => {
  const { description: _omit, ...rest } = validBody;
  const res = await post(rest);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "El campo description es obligatorio",
  });
});

test("POST /posts does not call the repository when validation fails", async () => {
  await post({ ...validBody, price: 1 });

  assert.equal(postsRepository.create.mock.callCount(), 0);
});

test("POST /posts responds 400 when post_image belongs to another user", async () => {
  const res = await post({ ...validBody, post_image: `${IMG_BASE}other-user/a.png` });

  assert.equal(res.status, 400);
  assert.equal(postsRepository.create.mock.callCount(), 0);
});

test("POST /posts responds 201 when post_image is in the user's own folder", async () => {
  const res = await post({ ...validBody, post_image: `${IMG_BASE}${USER_ID}/11111111-1111-4111-8111-111111111111.png` });

  assert.equal(res.status, 201);
});

test("POST /posts responds 400 La imagen no pertenece al usuario for a traversal url", async () => {
  const res = await post({
    ...validBody,
    post_image: `${IMG_BASE}${USER_ID}/../223e4567-e89b-12d3-a456-426614174000/11111111-1111-4111-8111-111111111111.png`,
  });

  assert.equal(res.status, 400);
  assert.equal(((await res.json()) as { message: string }).message, "La imagen no pertenece al usuario");
  assert.equal(postsRepository.create.mock.callCount(), 0);
});
