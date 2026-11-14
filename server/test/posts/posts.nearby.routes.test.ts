import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const postsRepository = {
  findAll: mock.fn(async (): Promise<Post[]> => []),
  findNearby: mock.fn(async (_a: number, _b: number, _c: number): Promise<unknown[]> => []),
  findById: mock.fn(async (_id: string): Promise<Post | undefined> => undefined),
  findTags: mock.fn(async (): Promise<string[]> => ["Conversar"]),
  create: mock.fn(async (_input: unknown): Promise<string> => "new-id"),
};

mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository: {} } });
mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/users/users.service", { exports: { usersService: {} } });

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
  for (const fn of Object.values(postsRepository)) fn.mock.resetCalls();
});

const BAD = { statusCode: 400, error: "Bad Request", message: "Parámetros de ubicación inválidos" };

test("GET /posts without params uses findAll", async () => {
  const res = await fetch(`${baseUrl}/posts`);

  assert.equal(res.status, 200);
  assert.equal(postsRepository.findAll.mock.callCount(), 1);
  assert.equal(postsRepository.findNearby.mock.callCount(), 0);
});

test("GET /posts with valid params uses findNearby and passes the body through", async () => {
  const rows = [{ id: "a", distance_km: 1.4 }];
  postsRepository.findNearby.mock.mockImplementationOnce(async () => rows);

  const res = await fetch(`${baseUrl}/posts?lat=3.45&lng=-76.53&radius_km=6`);

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), rows);
  assert.deepEqual(postsRepository.findNearby.mock.calls[0].arguments, [3.45, -76.53, 6]);
  assert.equal(postsRepository.findAll.mock.callCount(), 0);
});

for (const qs of [
  "lat=abc&lng=1&radius_km=1",
  "lat=3&lng=-76",
  "lat=1&lat=2&lng=1&radius_km=1",
  "lat=1&lng=1&radius_km=51",
  "lat=1&lng=1&radius_km=0",
  "lat=91&lng=1&radius_km=1",
]) {
  test(`GET /posts?${qs} responds 400`, async () => {
    const res = await fetch(`${baseUrl}/posts?${qs}`);

    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), BAD);
    assert.equal(postsRepository.findNearby.mock.callCount(), 0);
    assert.equal(postsRepository.findAll.mock.callCount(), 0);
  });
}

test("GET /posts/tags still routes to tags", async () => {
  const res = await fetch(`${baseUrl}/posts/tags`);

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), ["Conversar"]);
});

test("GET /posts/:id still routes to findById", async () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  postsRepository.findById.mock.mockImplementationOnce(async () => ({ id }) as Post);

  const res = await fetch(`${baseUrl}/posts/${id}?lat=1`);

  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as Post).id, id);
});
