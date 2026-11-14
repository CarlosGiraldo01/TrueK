import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

mock.module("../../src/features/users/users.service", { exports: { usersService: {} } });

let parseUpdateUserBody: typeof import("../../src/features/users/users.controller").parseUpdateUserBody;
let USER_MIN_AGE: number;
let USER_MAX_AGE: number;

before(async () => {
  ({ parseUpdateUserBody, USER_MIN_AGE, USER_MAX_AGE } = await import("../../src/features/users/users.controller"));
});

const rejects = (body: unknown, message: string) =>
  assert.throws(
    () => parseUpdateUserBody(body),
    (err: unknown) => {
      const e = err as { isBoom?: boolean; output?: { statusCode: number }; message: string };
      assert.equal(e.isBoom, true);
      assert.equal(e.output?.statusCode, 400);
      assert.equal(e.message, message);
      return true;
    },
  );

test("exports the age bounds", () => {
  assert.equal(USER_MIN_AGE, 18);
  assert.equal(USER_MAX_AGE, 120);
});

test("trims name and location", () => {
  assert.deepEqual(parseUpdateUserBody({ name: "  Ana ", location: " Cali  " }), { name: "Ana", location: "Cali" });
});

test("rejects empty or too long name and location, and non-strings", () => {
  const nameMsg = "El campo name debe tener entre 1 y 60 caracteres";
  rejects({ name: "   " }, nameMsg);
  rejects({ name: "a".repeat(61) }, nameMsg);
  rejects({ name: 5 }, nameMsg);
  assert.equal(parseUpdateUserBody({ name: "a".repeat(60) }).name?.length, 60);
  const locMsg = "El campo location debe tener entre 1 y 100 caracteres";
  rejects({ location: "" }, locMsg);
  rejects({ location: "a".repeat(101) }, locMsg);
  assert.equal(parseUpdateUserBody({ location: "a".repeat(100) }).location?.length, 100);
});

test("description: empty becomes null, null ok, 500 ok, 501 rejected", () => {
  assert.deepEqual(parseUpdateUserBody({ description: "" }), { description: null });
  assert.deepEqual(parseUpdateUserBody({ description: "   " }), { description: null });
  assert.deepEqual(parseUpdateUserBody({ description: null }), { description: null });
  assert.equal(parseUpdateUserBody({ description: "a".repeat(500) }).description?.length, 500);
  const msg = "El campo description debe ser un texto de máximo 500 caracteres";
  rejects({ description: "a".repeat(501) }, msg);
  rejects({ description: 3 }, msg);
});

test("age: 18 and 120 ok; out of range, decimals and strings rejected", () => {
  assert.deepEqual(parseUpdateUserBody({ age: 18 }), { age: 18 });
  assert.deepEqual(parseUpdateUserBody({ age: 120 }), { age: 120 });
  const msg = "El campo age debe ser un entero entre 18 y 120";
  rejects({ age: 17 }, msg);
  rejects({ age: 121 }, msg);
  rejects({ age: 30.5 }, msg);
  rejects({ age: "30" }, msg);
  rejects({ age: null }, msg);
});

test("profile_picture: string and null ok, number rejected", () => {
  assert.deepEqual(parseUpdateUserBody({ profile_picture: null }), { profile_picture: null });
  assert.deepEqual(parseUpdateUserBody({ profile_picture: "http://x/y.png" }), { profile_picture: "http://x/y.png" });
  rejects({ profile_picture: 4 }, "El campo profile_picture debe ser un texto o null");
});

test("coordinates: both numbers, both null and boundaries are accepted", () => {
  assert.deepEqual(parseUpdateUserBody({ latitude: 3.4, longitude: -76.5 }), { latitude: 3.4, longitude: -76.5 });
  assert.deepEqual(parseUpdateUserBody({ latitude: null, longitude: null }), { latitude: null, longitude: null });
  assert.deepEqual(parseUpdateUserBody({ latitude: 90, longitude: 180 }), { latitude: 90, longitude: 180 });
  assert.deepEqual(parseUpdateUserBody({ latitude: -90, longitude: -180 }), { latitude: -90, longitude: -180 });
});

test("coordinates: must be sent together", () => {
  const msg = "latitude y longitude deben enviarse juntas";
  rejects({ latitude: 1 }, msg);
  rejects({ longitude: 1 }, msg);
  rejects({ latitude: null, longitude: 1 }, msg);
  rejects({ latitude: 1, longitude: null }, msg);
});

test("coordinates: out of range or non finite are rejected", () => {
  const msg = "Coordenadas inválidas";
  rejects({ latitude: 90.1, longitude: 0 }, msg);
  rejects({ latitude: 0, longitude: -180.1 }, msg);
  rejects({ latitude: NaN, longitude: 0 }, msg);
  rejects({ latitude: 0, longitude: Infinity }, msg);
  rejects({ latitude: "1", longitude: 0 }, msg);
});

test("rejects non editable fields, including role", () => {
  for (const key of ["role", "email", "password", "id", "created_at", "whatever"]) {
    rejects({ name: "Ana", [key]: "x" }, `Campo no editable: ${key}`);
  }
  rejects({ role: "provider" }, "Campo no editable: role");
});

test("user_id alone means nothing to update and is never part of the patch", () => {
  rejects({ user_id: "abc" }, "No hay campos para actualizar");
  rejects({}, "No hay campos para actualizar");
  const patch = parseUpdateUserBody({ user_id: "abc", name: "Ana" });
  assert.deepEqual(patch, { name: "Ana" });
  assert.equal("user_id" in patch, false);
});

test("rejects non-object bodies", () => {
  for (const body of [undefined, null, "x", 5, [], [{ name: "a" }]]) {
    rejects(body, "Cuerpo de la solicitud inválido");
  }
});
