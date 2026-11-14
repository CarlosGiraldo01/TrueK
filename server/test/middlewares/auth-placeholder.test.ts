import { test } from "node:test";
import assert from "node:assert/strict";
import Boom from "@hapi/boom";
import type { Request } from "express";
import { getUserId } from "../../src/middlewares/auth-placeholder";

const fakeRequest = (body: unknown, query: Record<string, unknown>): Request =>
  ({ body, query }) as unknown as Request;

test("getUserId returns user_id from the body", () => {
  assert.equal(getUserId(fakeRequest({ user_id: "user-1" }, {})), "user-1");
});

test("getUserId falls back to user_id from the query string", () => {
  assert.equal(getUserId(fakeRequest(undefined, { user_id: "user-2" })), "user-2");
});

test("getUserId prefers the body over the query string", () => {
  assert.equal(getUserId(fakeRequest({ user_id: "body-id" }, { user_id: "query-id" })), "body-id");
});

test("getUserId throws a 400 Boom error when user_id is missing", () => {
  assert.throws(
    () => getUserId(fakeRequest({}, {})),
    (error: unknown) => Boom.isBoom(error) && error.output.statusCode === 400,
  );
});

test("getUserId throws a 400 Boom error when user_id is an empty string", () => {
  assert.throws(
    () => getUserId(fakeRequest({ user_id: "" }, { user_id: "  " })),
    (error: unknown) => Boom.isBoom(error) && error.output.statusCode === 400,
  );
});
