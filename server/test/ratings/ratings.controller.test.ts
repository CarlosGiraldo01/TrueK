import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

mock.module("../../src/features/ratings/ratings.service", {
  exports: { ratingsService: {} },
});

let parse: typeof import("../../src/features/ratings/ratings.controller").parseCreateRatingBody;

before(async () => {
  ({ parseCreateRatingBody: parse } = await import("../../src/features/ratings/ratings.controller"));
});

const RATER = "123e4567-e89b-12d3-a456-426614174000";
const REQ = "223e4567-e89b-12d3-a456-426614174000";
const body = (over: Record<string, unknown> = {}) => ({ service_request_id: REQ, rating: 4, comment: "ok", ...over });

const assertBadRequest = (fn: () => unknown, message?: string) =>
  assert.throws(fn, (e: unknown) => {
    const err = e as { isBoom?: boolean; output?: { statusCode: number }; message: string };
    return err.isBoom === true && err.output?.statusCode === 400 && (message === undefined || err.message === message);
  });

test("parseCreateRatingBody returns the input with rater id and rating kept", () => {
  assert.deepEqual(parse(body(), RATER), {
    rater_id: RATER,
    service_request_id: REQ,
    rating: 4,
    comment: "ok",
  });
});

test("parseCreateRatingBody trims the comment", () => {
  assert.equal(parse(body({ comment: "  hola  " }), RATER).comment, "hola");
});

test("parseCreateRatingBody turns a whitespace comment into null", () => {
  assert.equal(parse(body({ comment: "   " }), RATER).comment, null);
});

test("parseCreateRatingBody turns an empty comment into null", () => {
  assert.equal(parse(body({ comment: "" }), RATER).comment, null);
});

test("parseCreateRatingBody treats a null comment as absent", () => {
  assert.equal(parse(body({ comment: null }), RATER).comment, null);
});

test("parseCreateRatingBody treats a missing comment as absent", () => {
  const { comment: _omit, ...rest } = body();
  assert.equal(parse(rest, RATER).comment, null);
});

test("parseCreateRatingBody accepts a comment of exactly 500 characters", () => {
  assert.equal(parse(body({ comment: "a".repeat(500) }), RATER).comment?.length, 500);
});

test("parseCreateRatingBody rejects a comment of 501 characters", () => {
  assertBadRequest(() => parse(body({ comment: "a".repeat(501) }), RATER), "El comentario no puede superar 500 caracteres");
});

test("parseCreateRatingBody counts the comment length after trimming", () => {
  assert.equal(parse(body({ comment: `  ${"a".repeat(500)}  ` }), RATER).comment?.length, 500);
});

test("parseCreateRatingBody rejects a non-string comment", () => {
  assertBadRequest(() => parse(body({ comment: 5 }), RATER), "El campo comment debe ser un texto");
});

for (const bad of [0, 6, 3.5, "5", null, undefined, -1]) {
  test(`parseCreateRatingBody rejects rating ${JSON.stringify(bad)}`, () => {
    assertBadRequest(() => parse(body({ rating: bad }), RATER), "El campo rating debe ser un entero entre 1 y 5");
  });
}

for (const ok of [1, 2, 3, 4, 5]) {
  test(`parseCreateRatingBody accepts rating ${ok}`, () => {
    assert.equal(parse(body({ rating: ok }), RATER).rating, ok);
  });
}

test("parseCreateRatingBody rejects a non-UUID service_request_id", () => {
  assertBadRequest(
    () => parse(body({ service_request_id: "r123" }), RATER),
    "El campo service_request_id debe ser un id válido",
  );
});

test("parseCreateRatingBody rejects a missing service_request_id", () => {
  assertBadRequest(() => parse(body({ service_request_id: undefined }), RATER));
});

test("parseCreateRatingBody rejects a non-UUID rater id", () => {
  assertBadRequest(() => parse(body(), "u1"), "user_id inválido");
});

for (const bad of [null, undefined, [], "text", 5]) {
  test(`parseCreateRatingBody rejects body ${JSON.stringify(bad)}`, () => {
    assertBadRequest(() => parse(bad, RATER), "Cuerpo de la solicitud inválido");
  });
}
