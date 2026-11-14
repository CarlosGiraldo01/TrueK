import assert from "node:assert/strict";
import { test } from "node:test";
import { isUuid } from "../../src/utils/uuid";

test("isUuid accepts valid uuids in any case", () => {
  assert.equal(isUuid("123e4567-e89b-12d3-a456-426614174000"), true);
  assert.equal(isUuid("123E4567-E89B-12D3-A456-426614174000"), true);
});

test("isUuid rejects invalid values", () => {
  const invalid = [
    "",
    "../x",
    "u1",
    "123e4567-e89b-12d3-a456-42661417400",
    "123e4567-e89b-12d3-a456-4266141740000",
    " 123e4567-e89b-12d3-a456-426614174000",
    "123e4567-e89b-12d3-a456-42661417400g",
  ];
  for (const v of invalid) {
    assert.equal(isUuid(v), false, v);
  }
});
