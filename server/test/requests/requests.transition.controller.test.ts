import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

mock.module("../../src/features/requests/requests.service", { exports: { requestsService: {} } });

let parse: typeof import("../../src/features/requests/requests.controller").parsePatchRequestBody;

before(async () => {
  ({ parsePatchRequestBody: parse } = await import("../../src/features/requests/requests.controller"));
});

const bad = (message: string) => (err: unknown) => {
  const e = err as { output?: { statusCode: number }; message: string };
  assert.equal(e.output?.statusCode, 400);
  assert.equal(e.message, message);
  return true;
};

for (const action of ["accept", "reject", "finish"] as const) {
  test(`parsePatchRequestBody accepts action ${action}`, () => {
    assert.deepEqual(parse({ action }), { action });
  });
}

test("parsePatchRequestBody allows user_id and does not return it", () => {
  assert.deepEqual(parse({ user_id: "x", action: "accept" }), { action: "accept" });
});

for (const body of [{}, { action: "cancel" }, { action: 1 }, { action: null }, { action: "ACCEPT" }]) {
  test(`parsePatchRequestBody rejects invalid action ${JSON.stringify(body)}`, () => {
    assert.throws(() => parse(body), bad("Acción no válida"));
  });
}

for (const key of ["status", "price", "client_id", "foo"]) {
  test(`parsePatchRequestBody rejects extra key ${key}`, () => {
    assert.throws(() => parse({ action: "accept", [key]: "x" }), bad(`Campo no editable: ${key}`));
  });
}

for (const body of [null, undefined, "accept", 5, [], [{ action: "accept" }]]) {
  test(`parsePatchRequestBody rejects non-object body ${JSON.stringify(body)}`, () => {
    assert.throws(() => parse(body), bad("Cuerpo de la solicitud inválido"));
  });
}
