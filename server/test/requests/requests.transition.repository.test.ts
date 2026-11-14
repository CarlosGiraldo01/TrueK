import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const pool = { query: mock.fn(async (_sql: string, _params?: unknown[]): Promise<{ rows: unknown[] }> => ({ rows: [] })) };

mock.module("../../src/db/pool", { exports: { pool } });

let requestsRepository: typeof import("../../src/features/requests/requests.repository").requestsRepository;

before(async () => {
  ({ requestsRepository } = await import("../../src/features/requests/requests.repository"));
});

beforeEach(() => {
  pool.query.mock.resetCalls();
  pool.query.mock.mockImplementation(async () => ({ rows: [] }));
});

const notification = { user_id: "u", type: "request_accepted" as const, message: "msg" };

test("updateStatus runs exactly one query with the expected SQL", async () => {
  await requestsRepository.updateStatus("id1", "pending", "accepted", notification);

  assert.equal(pool.query.mock.callCount(), 1);
  const sql = pool.query.mock.calls[0].arguments[0].replace(/\s+/g, " ");
  assert.match(sql, /update service_requests set status = \$1 where id = \$2 and status = \$3/);
  assert.match(sql, /insert into notifications/);
  assert.match(sql, /select \$4, updated\.id, \$5, \$6 from updated/);
});

test("updateStatus passes params in the documented order", async () => {
  await requestsRepository.updateStatus("id1", "pending", "accepted", notification);

  assert.deepEqual(pool.query.mock.calls[0].arguments[1], ["accepted", "id1", "pending", "u", "request_accepted", "msg"]);
});

test("updateStatus returns the first row", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [{ id: "id1", status: "accepted" }, { id: "x" }] }));
  assert.deepEqual(await requestsRepository.updateStatus("id1", "pending", "accepted", notification), {
    id: "id1",
    status: "accepted",
  });
});

test("updateStatus returns undefined when no row matched", async () => {
  assert.equal(await requestsRepository.updateStatus("id1", "pending", "accepted", notification), undefined);
});
