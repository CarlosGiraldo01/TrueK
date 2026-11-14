import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const pool = { query: mock.fn(async (_sql: string, _params?: unknown[]): Promise<{ rows: unknown[] }> => ({ rows: [] })) };

mock.module("../../src/db/pool", { exports: { pool } });

let ratingsRepository: typeof import("../../src/features/ratings/ratings.repository").ratingsRepository;

before(async () => {
  ({ ratingsRepository } = await import("../../src/features/ratings/ratings.repository"));
});

beforeEach(() => {
  pool.query.mock.resetCalls();
});

const data = { service_request_id: "r", rated_user_id: "u", rating: 5 as const, comment: "c" };
const row = { id: "1", ...data };

test("ratingsRepository.create returns the inserted row", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));

  assert.deepEqual(await ratingsRepository.create(data), row);
});

test("ratingsRepository.create passes the values as query parameters", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await ratingsRepository.create(data);

  assert.deepEqual(pool.query.mock.calls[0].arguments[1], ["r", "u", 5, "c"]);
});

test("ratingsRepository.create maps the unique violation to a 409 Boom", async () => {
  pool.query.mock.mockImplementation(async () => {
    throw Object.assign(new Error("dup"), { code: "23505", constraint: "ratings_request_rated_user_unique" });
  });

  await assert.rejects(ratingsRepository.create(data), (e: unknown) => {
    const err = e as { isBoom?: boolean; output?: { statusCode: number }; message: string };
    return err.isBoom === true && err.output?.statusCode === 409 && err.message === "Ya calificaste este servicio";
  });
});

test("ratingsRepository.create rethrows a unique violation on another constraint", async () => {
  const pgError = Object.assign(new Error("other"), { code: "23505", constraint: "something_else" });
  pool.query.mock.mockImplementation(async () => {
    throw pgError;
  });

  await assert.rejects(ratingsRepository.create(data), (e: unknown) => e === pgError);
});

test("ratingsRepository.create rethrows other pg errors unchanged", async () => {
  const pgError = Object.assign(new Error("fk"), { code: "23503" });
  pool.query.mock.mockImplementation(async () => {
    throw pgError;
  });

  await assert.rejects(ratingsRepository.create(data), (e: unknown) => e === pgError);
});
