import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { Rating } from "../../src/features/ratings/ratings.types";

const ratingsRepository = {
  findAll: mock.fn(async (): Promise<Rating[]> => []),
  findById: mock.fn(async (): Promise<Rating | undefined> => undefined),
};

mock.module("../../src/features/ratings/ratings.repository", {
  exports: { ratingsRepository },
});

let ratingsService: typeof import("../../src/features/ratings/ratings.service").ratingsService;

before(async () => {
  ({ ratingsService } = await import("../../src/features/ratings/ratings.service"));
});

beforeEach(() => {
  ratingsRepository.findAll.mock.resetCalls();
  ratingsRepository.findById.mock.resetCalls();
});

const rating = (id: string, rated_user_id: string, value: Rating["rating"]): Rating => ({
  id,
  service_request_id: `req-${id}`,
  rated_user_id,
  rating: value,
  comment: "",
});

test("ratingsService.getAverages returns the mean rating received by each user", async () => {
  ratingsRepository.findAll.mock.mockImplementation(async () => [
    rating("1", "u1", 5),
    rating("2", "u1", 4),
    rating("3", "u2", 3),
  ]);

  const averages = await ratingsService.getAverages();

  assert.deepEqual(averages, { u1: 4.5, u2: 3 });
});

test("ratingsService.getAverages returns an empty object when there are no ratings", async () => {
  ratingsRepository.findAll.mock.mockImplementation(async () => []);

  const averages = await ratingsService.getAverages();

  assert.deepEqual(averages, {});
});

test("ratingsService.getById resolves undefined when the rating does not exist", async () => {
  ratingsRepository.findById.mock.mockImplementation(async () => undefined);

  const result = await ratingsService.getById("missing");

  assert.equal(result, undefined);
});
