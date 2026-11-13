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
});

const data = {
  post_id: "p",
  client_id: "c",
  meeting_address: "addr",
  meeting_date: "2999-01-01T00:00:00.000Z",
  hours: 2,
  request_image: null,
  price: 20000,
  provider_id: "prov",
  notification_message: "msg",
};
const row = { id: "r1", status: "pending" };

test("create runs exactly one query (single atomic statement)", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await requestsRepository.create(data);

  assert.equal(pool.query.mock.callCount(), 1);
});

test("create SQL inserts the request and the notification with fixed literals", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await requestsRepository.create(data);

  const sql = String(pool.query.mock.calls[0].arguments[0]).replace(/\s+/g, " ").toLowerCase();
  assert.ok(sql.includes("insert into service_requests"));
  assert.ok(sql.includes("insert into notifications"));
  assert.ok(sql.includes("'pending'"));
  assert.ok(sql.includes("false"));
  assert.ok(sql.includes("'incoming_services'"));
});

test("create passes params in the documented order and never status", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await requestsRepository.create(data);

  const params = pool.query.mock.calls[0].arguments[1] as unknown[];
  assert.deepEqual(params, ["p", "c", "addr", "2999-01-01T00:00:00.000Z", 2, null, 20000, "prov", "msg"]);
  assert.equal(params.includes("pending"), false);
});

test("create returns rows[0]", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));

  assert.deepEqual(await requestsRepository.create(data), row);
});
