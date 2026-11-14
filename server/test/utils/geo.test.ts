import assert from "node:assert/strict";
import { test } from "node:test";
import { haversineKmSql } from "../../src/utils/geo";

const sql = haversineKmSql("$1", "$2", "p.latitude", "p.longitude");

test("haversineKmSql uses earth radius, asin and the NaN guards", () => {
  assert.match(sql, /6371/);
  assert.match(sql, /asin\(/);
  assert.match(sql, /least\(1\.0/);
  assert.match(sql, /greatest\(0\.0/);
});

test("haversineKmSql applies radians() to the given arguments verbatim", () => {
  for (const arg of ["$1", "$2", "p.latitude", "p.longitude"]) {
    assert.ok(sql.includes(`radians(${arg})`), `missing radians(${arg})`);
  }
});

test("haversineKmSql interpolates arbitrary arguments as-is", () => {
  const out = haversineKmSql("a1", "b2", "c3", "d4");
  for (const arg of ["a1", "b2", "c3", "d4"]) assert.ok(out.includes(arg));
  assert.ok(!out.includes("$1"));
});

test("haversineKmSql has balanced parentheses", () => {
  const opens = (sql.match(/\(/g) ?? []).length;
  const closes = (sql.match(/\)/g) ?? []).length;
  assert.equal(opens, closes);
});
