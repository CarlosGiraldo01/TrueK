import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const pool = {
  query: mock.fn(async (_sql: string, _params?: unknown[]): Promise<{ rows: unknown[] }> => ({ rows: [] })),
};

mock.module("../../src/db/pool", { exports: { pool } });

let postsRepository: typeof import("../../src/features/posts/posts.repository").postsRepository;

before(async () => {
  ({ postsRepository } = await import("../../src/features/posts/posts.repository"));
});

beforeEach(() => {
  pool.query.mock.resetCalls();
});

test("findNearby runs one query with params [lat, lng, radiusKm] and returns rows", async () => {
  const rows = [{ id: "a", distance_km: 1.2 }];
  pool.query.mock.mockImplementation(async () => ({ rows }));

  const result = await postsRepository.findNearby(3.123456, -76.654321, 7.777);

  assert.equal(pool.query.mock.callCount(), 1);
  assert.deepEqual(pool.query.mock.calls[0].arguments[1], [3.123456, -76.654321, 7.777]);
  assert.equal(result, rows);
});

test("findNearby SQL has the expected shape and no interpolated user values", async () => {
  await postsRepository.findNearby(3.123456, -76.654321, 7.777);
  const sql = String(pool.query.mock.calls[0].arguments[0]);

  assert.ok(sql.includes("cross join lateral"));
  assert.ok(sql.includes("where dist.d <= $3::double precision"));
  assert.ok(sql.includes("::double precision as distance_km"));
  assert.ok(sql.includes("order by dist.d asc"));
  assert.ok(sql.includes("group by p.id, dist.d"));
  for (const v of ["3.123456", "76.654321", "7.777"]) {
    assert.ok(!sql.includes(v), `SQL must not contain ${v}`);
  }
});

test("findAll SQL has no distance_km", async () => {
  await postsRepository.findAll();
  const sql = String(pool.query.mock.calls[0].arguments[0]);

  assert.ok(!sql.includes("distance_km"));
});
