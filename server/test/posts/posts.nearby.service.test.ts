import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const postsRepository = {
  findAll: mock.fn(async (): Promise<Post[]> => []),
  findNearby: mock.fn(async (_a: number, _b: number, _c: number): Promise<Post[]> => []),
};

mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository: {} } });
mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/users/users.service", { exports: { usersService: {} } });

let postsService: typeof import("../../src/features/posts/posts.service").postsService;

before(async () => {
  ({ postsService } = await import("../../src/features/posts/posts.service"));
});

beforeEach(() => {
  postsRepository.findAll.mock.resetCalls();
  postsRepository.findNearby.mock.resetCalls();
});

test("getAll with nearby calls findNearby(lat, lng, radiusKm) only", async () => {
  const rows = [{ id: "n" }] as Post[];
  postsRepository.findNearby.mock.mockImplementation(async () => rows);

  const result = await postsService.getAll({ lat: 3.4, lng: -76.5, radiusKm: 6 });

  assert.equal(result, rows);
  assert.deepEqual(postsRepository.findNearby.mock.calls[0].arguments, [3.4, -76.5, 6]);
  assert.equal(postsRepository.findAll.mock.callCount(), 0);
});

test("getAll with null or undefined calls findAll only", async () => {
  await postsService.getAll(null);
  await postsService.getAll();

  assert.equal(postsRepository.findAll.mock.callCount(), 2);
  assert.equal(postsRepository.findNearby.mock.callCount(), 0);
});
