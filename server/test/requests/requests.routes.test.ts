import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const POST = "323e4567-e89b-12d3-a456-426614174000";
const IMG_BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";

const makePost = (over: Partial<Post> = {}): Post => ({ id: POST, user_id: PROVIDER, price: 5000, ...over }) as Post;

type CreateData = Parameters<typeof import("../../src/features/requests/requests.repository").requestsRepository.create>[0];

const postsRepository = { findById: mock.fn(async (_id: string): Promise<Post | undefined> => makePost()) };
const requestsRepository = {
  create: mock.fn(async (d: CreateData) => ({
    id: "new",
    post_id: d.post_id,
    client_id: d.client_id,
    meeting_address: d.meeting_address,
    meeting_date: d.meeting_date,
    hours: d.hours,
    status: "pending",
    request_image: d.request_image,
    payment_confirmed: false,
    price: d.price,
  })),
};
const uploadsRepository = {
  upload: mock.fn(async (): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${IMG_BASE}${path}`),
};

mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/requests/requests.repository", { exports: { requestsRepository } });
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });

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
  requestsRepository.create.mock.resetCalls();
  postsRepository.findById.mock.mockImplementation(async () => makePost());
});

const valid = (): Record<string, unknown> => ({
  user_id: CLIENT,
  post_id: POST,
  meeting_address: "Calle 1",
  meeting_date: "2999-01-01T00:00:00.000Z",
  hours: 2,
});

const boom = (statusCode: number, error: string, message: string) => ({ statusCode, error, message });

const send = (body: unknown): Promise<Response> =>
  fetch(`${baseUrl}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("POST /requests responds 201 with the request and provider_id", async () => {
  const res = await send(valid());
  const body = (await res.json()) as Record<string, unknown>;

  assert.equal(res.status, 201);
  assert.equal(body.provider_id, PROVIDER);
  assert.equal(body.status, "pending");
  assert.equal(body.price, 10000);
  assert.equal(body.client_id, CLIENT);
  assert.equal(requestsRepository.create.mock.callCount(), 1);
});

test("POST /requests without user_id responds 400", async () => {
  const { user_id: _u, ...rest } = valid();
  const res = await send(rest);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), boom(400, "Bad Request", "Falta user_id"));
});

test("POST /requests with a non-UUID user_id responds 400", async () => {
  const res = await send({ ...valid(), user_id: "abc" });

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), boom(400, "Bad Request", "user_id inválido"));
});

test("POST /requests rejects client-provided price, status and provider_id", async () => {
  for (const [key, value] of [["price", 1], ["status", "accepted"], ["provider_id", CLIENT]] as const) {
    const res = await send({ ...valid(), [key]: value });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), boom(400, "Bad Request", `Campo no editable: ${key}`));
  }
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("POST /requests rejects a past meeting_date", async () => {
  const res = await send({ ...valid(), meeting_date: "2000-01-01T00:00:00.000Z" });

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), boom(400, "Bad Request", "meeting_date debe ser una fecha futura"));
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("POST /requests on the client's own post responds 409", async () => {
  postsRepository.findById.mock.mockImplementation(async () => makePost({ user_id: CLIENT }));
  const res = await send(valid());

  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), boom(409, "Conflict", "No puedes solicitar tu propio servicio"));
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("POST /requests on an unknown post responds 404", async () => {
  postsRepository.findById.mock.mockImplementation(async () => undefined);
  const res = await send(valid());

  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), boom(404, "Not Found", "Publicación no encontrada"));
});

test("POST /requests rejects a foreign request_image with 400", async () => {
  const res = await send({ ...valid(), request_image: "https://evil.example/x.png" });

  assert.equal(res.status, 400);
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("GET /requests/quote still rejects hours=13", async () => {
  const res = await fetch(`${baseUrl}/requests/quote?post_id=${POST}&hours=13`);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "Las horas deben ser un número entre 1 y 12" });
});
