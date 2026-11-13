import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const pool = {
  query: mock.fn(async (_sql: string, _params?: unknown[]): Promise<{ rows: unknown[] }> => ({ rows: [] })),
};

mock.module("../../src/db/pool", { exports: { pool } });

let usersRepository: typeof import("../../src/features/users/users.repository").usersRepository;

before(async () => {
  ({ usersRepository } = await import("../../src/features/users/users.repository"));
});

beforeEach(() => {
  pool.query.mock.resetCalls();
  pool.query.mock.mockImplementation(async () => ({ rows: [{ id: "u" }] }));
});

test("update builds SET only for the given columns, params in order, id last", async () => {
  await usersRepository.update("u", { location: "Cali", name: "Ana" });
  const [sql, params] = pool.query.mock.calls[0].arguments;

  assert.match(sql, /update users set name = \$1, location = \$2 where id = \$3 returning /);
  assert.deepEqual(params, ["Ana", "Cali", "u"]);
  assert.doesNotMatch(sql.split(" returning ")[0], /age|role|email|password|description/);
});

test("update sets both coordinate columns", async () => {
  await usersRepository.update("u", { latitude: 1.5, longitude: -2.5 });
  const [sql, params] = pool.query.mock.calls[0].arguments;

  assert.match(sql, /set latitude = \$1, longitude = \$2 where id = \$3/);
  assert.deepEqual(params, [1.5, -2.5, "u"]);
});

test("update keeps null values (clearing a field) and skips undefined", async () => {
  await usersRepository.update("u", { description: null, profile_picture: null, age: undefined });
  const [sql, params] = pool.query.mock.calls[0].arguments;

  assert.match(sql, /set description = \$1, profile_picture = \$2 where id = \$3/);
  assert.deepEqual(params, [null, null, "u"]);
});

test("update returns the first row, or undefined when none matched", async () => {
  assert.deepEqual(await usersRepository.update("u", { name: "a" }), { id: "u" });
  pool.query.mock.mockImplementation(async () => ({ rows: [] }));
  assert.equal(await usersRepository.update("u", { name: "a" }), undefined);
});

test("update never interpolates values into the SQL", async () => {
  await usersRepository.update("u", { name: "x; drop table users;--" });
  const [sql] = pool.query.mock.calls[0].arguments;
  assert.doesNotMatch(sql, /drop table/);
});

test("update returns coordinates in the returning clause", async () => {
  await usersRepository.update("u", { name: "a" });
  assert.match(pool.query.mock.calls[0].arguments[0], /returning .*latitude, longitude/);
});
