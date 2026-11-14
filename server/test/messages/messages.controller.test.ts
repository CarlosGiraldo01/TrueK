import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

mock.module("../../src/features/messages/messages.service", {
  exports: { messagesService: {} },
});

let parse: typeof import("../../src/features/messages/messages.controller").parseCreateMessageBody;

before(async () => {
  ({ parseCreateMessageBody: parse } = await import("../../src/features/messages/messages.controller"));
});

const SENDER = "123e4567-e89b-12d3-a456-426614174000";
const REQ = "223e4567-e89b-12d3-a456-426614174000";
const body = (over: Record<string, unknown> = {}) => ({ service_request_id: REQ, content: "hola", ...over });

const assertBadRequest = (fn: () => unknown, message: string) =>
  assert.throws(fn, (e: unknown) => {
    const err = e as { isBoom?: boolean; output?: { statusCode: number }; message: string };
    return err.isBoom === true && err.output?.statusCode === 400 && err.message === message;
  });

test("parseCreateMessageBody returns the input with sender id and request id", () => {
  assert.deepEqual(parse(body(), SENDER), { sender_id: SENDER, service_request_id: REQ, content: "hola" });
});

test("parseCreateMessageBody trims the content", () => {
  assert.equal(parse(body({ content: "  hola  " }), SENDER).content, "hola");
});

test("parseCreateMessageBody accepts exactly 1000 characters", () => {
  assert.equal(parse(body({ content: "a".repeat(1000) }), SENDER).content.length, 1000);
});

test("parseCreateMessageBody accepts a 1000 character message padded with whitespace", () => {
  assert.equal(parse(body({ content: `  ${"a".repeat(1000)}  ` }), SENDER).content.length, 1000);
});

test("parseCreateMessageBody rejects 1001 characters", () => {
  assertBadRequest(
    () => parse(body({ content: "a".repeat(1001) }), SENDER),
    "El mensaje no puede superar 1000 caracteres",
  );
});

for (const [label, content] of [
  ["whitespace only", "   "],
  ["an empty string", ""],
  ["a number", 5],
  ["null", null],
] as const) {
  test(`parseCreateMessageBody rejects content that is ${label}`, () => {
    assertBadRequest(() => parse(body({ content }), SENDER), "El mensaje no puede estar vacío");
  });
}

test("parseCreateMessageBody rejects a missing content", () => {
  assertBadRequest(() => parse({ service_request_id: REQ }, SENDER), "El mensaje no puede estar vacío");
});

test("parseCreateMessageBody rejects a non-UUID service_request_id", () => {
  assertBadRequest(
    () => parse(body({ service_request_id: "abc" }), SENDER),
    "El campo service_request_id debe ser un id válido",
  );
});

test("parseCreateMessageBody rejects a missing service_request_id", () => {
  assertBadRequest(() => parse({ content: "hola" }, SENDER), "El campo service_request_id debe ser un id válido");
});

test("parseCreateMessageBody rejects a non-UUID sender id", () => {
  assertBadRequest(() => parse(body(), "nope"), "user_id inválido");
});

for (const [label, value] of [
  ["null", null],
  ["an array", []],
  ["a string", "hola"],
] as const) {
  test(`parseCreateMessageBody rejects a body that is ${label}`, () => {
    assertBadRequest(() => parse(value, SENDER), "Cuerpo de la solicitud inválido");
  });
}
