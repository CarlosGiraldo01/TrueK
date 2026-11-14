import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const pool = {
  query: mock.fn(async (_sql: string, _params?: unknown[]): Promise<{ rows: unknown[] }> => ({ rows: [] })),
};

mock.module("../../src/db/pool", { exports: { pool } });

let messagesRepository: typeof import("../../src/features/messages/messages.repository").messagesRepository;

before(async () => {
  ({ messagesRepository } = await import("../../src/features/messages/messages.repository"));
});

beforeEach(() => {
  pool.query.mock.resetCalls();
});

const data = { service_request_id: "r", sender_id: "u", content: "hola" };
const row = { id: "1", ...data, created_at: "2026-01-01T00:00:00Z" };

test("messagesRepository.create returns the inserted row", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));

  assert.deepEqual(await messagesRepository.create(data), row);
});

test("messagesRepository.create passes the values as parameters in column order", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await messagesRepository.create(data);

  assert.deepEqual(pool.query.mock.calls[0].arguments[1], ["r", "u", "hola"]);
});

test("messagesRepository.create inserts into chat_messages", async () => {
  pool.query.mock.mockImplementation(async () => ({ rows: [row] }));
  await messagesRepository.create(data);

  assert.match(
    String(pool.query.mock.calls[0].arguments[0]),
    /insert into chat_messages \(service_request_id, user_id, message\)/,
  );
});
