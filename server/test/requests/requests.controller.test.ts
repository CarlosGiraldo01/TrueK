import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

mock.module("../../src/features/requests/requests.service", { exports: { requestsService: {} } });

let parse: typeof import("../../src/features/requests/requests.controller").parseCreateRequestBody;
let consts: { MIN_HOURS: number; MAX_HOURS: number };

before(async () => {
  const mod = await import("../../src/features/requests/requests.controller");
  parse = mod.parseCreateRequestBody;
  consts = { MIN_HOURS: mod.MIN_HOURS, MAX_HOURS: mod.MAX_HOURS };
});

const POST = "123e4567-e89b-12d3-a456-426614174000";
const future = (): string => new Date(Date.now() + 86_400_000).toISOString();
const valid = (): Record<string, unknown> => ({
  user_id: "x",
  post_id: POST,
  meeting_address: "  Calle 1 #2-3  ",
  meeting_date: future(),
  hours: 3,
});

const rejects = (body: unknown, message: string): void => {
  assert.throws(
    () => parse(body),
    (err: unknown) => {
      const e = err as { output?: { statusCode: number }; message: string };
      assert.equal(e.output?.statusCode, 400);
      assert.equal(e.message, message);
      return true;
    },
  );
};

test("exports hour limits 1 and 12", () => {
  assert.equal(consts.MIN_HOURS, 1);
  assert.equal(consts.MAX_HOURS, 12);
});

test("valid body is normalized and user_id is not returned", () => {
  const body = valid();
  const out = parse(body);
  assert.equal(out.post_id, POST);
  assert.equal(out.meeting_address, "Calle 1 #2-3");
  assert.equal(out.meeting_date, new Date(body.meeting_date as string).toISOString());
  assert.equal(out.hours, 3);
  assert.equal("user_id" in out, false);
  assert.ok(out.request_image === undefined || out.request_image === null);
});

test("request_image string and null are kept", () => {
  assert.equal(parse({ ...valid(), request_image: "https://a/b.png" }).request_image, "https://a/b.png");
  assert.equal(parse({ ...valid(), request_image: null }).request_image, null);
});

test("request_image of another type is rejected", () => {
  rejects({ ...valid(), request_image: 5 }, "El campo request_image debe ser un texto o null");
});

test("meeting_date is normalized to ISO", () => {
  const t = Date.now() + 3_600_000;
  assert.equal(
    parse({ ...valid(), meeting_date: new Date(t).toUTCString() }).meeting_date,
    new Date(Math.floor(t / 1000) * 1000).toISOString(),
  );
});

for (const key of ["price", "status", "payment_confirmed", "provider_id", "client_id", "whatever"]) {
  test(`rejects non-editable field ${key}`, () => {
    rejects({ ...valid(), [key]: "x" }, `Campo no editable: ${key}`);
  });
}

test("rejects non-object bodies", () => {
  for (const b of [null, undefined, "str", 5, [], [valid()]]) rejects(b, "Cuerpo de la solicitud inválido");
});

test("rejects missing or non-UUID post_id", () => {
  const { post_id: _p, ...rest } = valid();
  rejects(rest, "post_id inválido");
  rejects({ ...valid(), post_id: "nope" }, "post_id inválido");
  rejects({ ...valid(), post_id: 7 }, "post_id inválido");
});

test("meeting_address is trimmed and limited to 1..200", () => {
  const msg = "El campo meeting_address debe tener entre 1 y 200 caracteres";
  rejects({ ...valid(), meeting_address: "" }, msg);
  rejects({ ...valid(), meeting_address: "   " }, msg);
  rejects({ ...valid(), meeting_address: "a".repeat(201) }, msg);
  rejects({ ...valid(), meeting_address: 4 }, msg);
  const { meeting_address: _m, ...rest } = valid();
  rejects(rest, msg);
  assert.equal(parse({ ...valid(), meeting_address: "a".repeat(200) }).meeting_address.length, 200);
  assert.equal(parse({ ...valid(), meeting_address: ` ${"a".repeat(200)} ` }).meeting_address.length, 200);
});

test("hours must be an integer between 1 and 12", () => {
  const msg = "Las horas deben ser un número entre 1 y 12";
  for (const h of [0, 13, 1.5, "2", null, NaN, -1]) rejects({ ...valid(), hours: h }, msg);
  const { hours: _h, ...rest } = valid();
  rejects(rest, msg);
  assert.equal(parse({ ...valid(), hours: 1 }).hours, 1);
  assert.equal(parse({ ...valid(), hours: 12 }).hours, 12);
});

test("meeting_date must be a future parseable date string", () => {
  const msg = "meeting_date debe ser una fecha futura";
  for (const d of ["2000-01-01T10:00:00Z", new Date(Date.now() - 5000).toISOString(), "not a date", 12345, null]) {
    rejects({ ...valid(), meeting_date: d }, msg);
  }
  const { meeting_date: _d, ...rest } = valid();
  rejects(rest, msg);
  assert.equal(
    parse({ ...valid(), meeting_date: "2999-01-01T00:00:00.000Z" }).meeting_date,
    "2999-01-01T00:00:00.000Z",
  );
});
