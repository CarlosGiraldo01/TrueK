import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const POST = "323e4567-e89b-12d3-a456-426614174000";
const FILE = "423e4567-e89b-12d3-a456-426614174000";
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

let requestsService: typeof import("../../src/features/requests/requests.service").requestsService;

before(async () => {
  ({ requestsService } = await import("../../src/features/requests/requests.service"));
});

beforeEach(() => {
  postsRepository.findById.mock.resetCalls();
  postsRepository.findById.mock.mockImplementation(async () => makePost());
  requestsRepository.create.mock.resetCalls();
});

const input = { post_id: POST, meeting_address: "Calle 1", meeting_date: "2999-01-01T00:00:00.000Z", hours: 3 };

const status = (code: number, message: string) => (err: unknown) => {
  const e = err as { output?: { statusCode: number }; message: string };
  assert.equal(e.output?.statusCode, code);
  assert.equal(e.message, message);
  return true;
};

test("create calls the repository once with server-computed data and returns provider_id", async () => {
  const result = await requestsService.create(CLIENT, input);

  assert.equal(requestsRepository.create.mock.callCount(), 1);
  assert.deepEqual(requestsRepository.create.mock.calls[0].arguments[0], {
    post_id: POST,
    client_id: CLIENT,
    meeting_address: "Calle 1",
    meeting_date: "2999-01-01T00:00:00.000Z",
    hours: 3,
    request_image: null,
    price: 15000,
    provider_id: PROVIDER,
    notification_message: "Solicita tus servicios de:",
  });
  assert.equal(result.provider_id, PROVIDER);
  assert.equal(result.id, "new");
});

test("create falls back to 10000 per hour when the post has no price", async () => {
  postsRepository.findById.mock.mockImplementation(async () => makePost({ price: undefined }));
  await requestsService.create(CLIENT, { ...input, hours: 2 });

  assert.equal(requestsRepository.create.mock.calls[0].arguments[0].price, 20000);
});

test("create throws 404 for an unknown post without calling the repository", async () => {
  postsRepository.findById.mock.mockImplementation(async () => undefined);

  await assert.rejects(requestsService.create(CLIENT, input), status(404, "Publicación no encontrada"));
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("create throws 409 for the client's own post", async () => {
  postsRepository.findById.mock.mockImplementation(async () => makePost({ user_id: CLIENT }));

  await assert.rejects(requestsService.create(CLIENT, input), status(409, "No puedes solicitar tu propio servicio"));
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("create rejects a foreign or arbitrary image URL", async () => {
  for (const url of [
    "https://evil.example/x.png",
    `${IMG_BASE}${PROVIDER}/${FILE}.png`,
    `${IMG_BASE}${CLIENT}/../${PROVIDER}/${FILE}.png`,
  ]) {
    await assert.rejects(
      requestsService.create(CLIENT, { ...input, request_image: url }),
      status(400, "La imagen no pertenece al usuario"),
    );
  }
  assert.equal(requestsRepository.create.mock.callCount(), 0);
});

test("create accepts an image URL owned by the client", async () => {
  const url = `${IMG_BASE}${CLIENT}/${FILE}.png`;
  await requestsService.create(CLIENT, { ...input, request_image: url });

  assert.equal(requestsRepository.create.mock.calls[0].arguments[0].request_image, url);
});
