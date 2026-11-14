import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { User } from "../../src/features/users/users.types";

const ID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER = "223e4567-e89b-12d3-a456-426614174000";
const IMG_BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";

const makeUser = (over: Partial<User> = {}): User => ({
  id: ID,
  name: "Ana",
  email: "a@b.c",
  profile_picture: null,
  age: 30,
  location: "Cali",
  description: null,
  role: "client",
  latitude: 3.4,
  longitude: -76.5,
  ...over,
});

const usersRepository = {
  findAll: mock.fn(async (): Promise<User[]> => []),
  findById: mock.fn(async (_id: string): Promise<User | undefined> => makeUser()),
  update: mock.fn(async (_id: string, _patch: unknown): Promise<User | undefined> => makeUser({ name: "Nueva" })),
};
const uploadsRepository = {
  upload: mock.fn(async (): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${IMG_BASE}${path}`),
};

mock.module("../../src/features/users/users.repository", { exports: { usersRepository } });
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });

let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await import("../../src/app");
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  usersRepository.update.mock.resetCalls();
  usersRepository.update.mock.mockImplementation(async () => makeUser({ name: "Nueva" }));
});

const patch = (id: string, body: unknown): Promise<Response> =>
  fetch(`${baseUrl}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("PATCH /users/:id responds 200 with the updated user", async () => {
  const res = await patch(ID, { user_id: ID, name: " Nueva " });

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), makeUser({ name: "Nueva" }));
  assert.deepEqual(usersRepository.update.mock.calls[0].arguments, [ID, { name: "Nueva" }]);
});

test("PATCH /users/:id accepts an own uploaded profile_picture", async () => {
  const url = `${IMG_BASE}${ID}/${OTHER}.png`;
  const res = await patch(ID, { user_id: ID, profile_picture: url });

  assert.equal(res.status, 200);
  assert.equal(usersRepository.update.mock.callCount(), 1);
});

test("PATCH /users/:id responds 400 for a foreign profile_picture", async () => {
  const res = await patch(ID, { user_id: ID, profile_picture: `${IMG_BASE}${OTHER}/${ID}.png` });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "La imagen no pertenece al usuario");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id responds 403 when the requester is not the user", async () => {
  const res = await patch(ID, { user_id: OTHER, name: "Hack" });

  assert.equal(res.status, 403);
  assert.equal((await res.json()).message, "Solo puedes editar tu propio perfil");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id responds 400 Falta user_id when user_id is missing", async () => {
  const res = await patch(ID, { name: "Ana" });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "Falta user_id");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id responds 400 for a non-UUID id", async () => {
  const res = await patch("abc", { user_id: "abc", name: "Ana" });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "id de usuario inválido");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id rejects role changes", async () => {
  const res = await patch(ID, { user_id: ID, role: "provider" });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "Campo no editable: role");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id responds 400 for an invalid age", async () => {
  const res = await patch(ID, { user_id: ID, age: 17 });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "El campo age debe ser un entero entre 18 y 120");
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("PATCH /users/:id responds 400 when there is nothing to update", async () => {
  const res = await patch(ID, { user_id: ID });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).message, "No hay campos para actualizar");
});

test("PATCH /users/:id responds 404 when the user does not exist", async () => {
  usersRepository.update.mock.mockImplementation(async () => undefined);
  const res = await patch(ID, { user_id: ID, name: "Ana" });

  assert.equal(res.status, 404);
  assert.equal((await res.json()).message, "Usuario no encontrado");
});

test("GET /users/:id still works and includes latitude and longitude", async () => {
  const res = await fetch(`${baseUrl}/users/${ID}`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.latitude, 3.4);
  assert.equal(body.longitude, -76.5);
});
