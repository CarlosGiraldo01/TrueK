import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { User } from "../../src/features/users/users.types";

const ID = "123e4567-e89b-12d3-a456-426614174000";
const OTHER = "223e4567-e89b-12d3-a456-426614174000";
const IMG_BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";
const FILE = "323e4567-e89b-12d3-a456-426614174000";

const user = { id: ID, name: "Ana" } as User;
const usersRepository = {
  update: mock.fn(async (_id: string, _patch: unknown): Promise<User | undefined> => user),
};
const uploadsRepository = {
  upload: mock.fn(async (): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${IMG_BASE}${path}`),
};

mock.module("../../src/features/users/users.repository", { exports: { usersRepository } });
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });

let usersService: typeof import("../../src/features/users/users.service").usersService;

before(async () => {
  ({ usersService } = await import("../../src/features/users/users.service"));
});

beforeEach(() => {
  usersRepository.update.mock.resetCalls();
  usersRepository.update.mock.mockImplementation(async () => user);
});

const status = (code: number, message: string) => (err: unknown) => {
  const e = err as { output?: { statusCode: number }; message: string };
  assert.equal(e.output?.statusCode, code);
  assert.equal(e.message, message);
  return true;
};

test("update passes the patch through and returns the user", async () => {
  const patch = { name: "Ana", age: 30 };
  assert.equal(await usersService.update(ID, patch), user);
  assert.deepEqual(usersRepository.update.mock.calls[0].arguments, [ID, patch]);
});

test("update rejects a foreign or invalid profile_picture without calling the repository", async () => {
  for (const url of [
    "https://evil.example/x.png",
    `${IMG_BASE}${OTHER}/${FILE}.png`,
    `${IMG_BASE}${ID}/../${OTHER}/${FILE}.png`,
    `${IMG_BASE}${ID}/${FILE}.png?x=1`,
  ]) {
    await assert.rejects(
      usersService.update(ID, { profile_picture: url }),
      status(400, "La imagen no pertenece al usuario"),
    );
  }
  assert.equal(usersRepository.update.mock.callCount(), 0);
});

test("update accepts an image url that belongs to the user", async () => {
  const url = `${IMG_BASE}${ID}/${FILE}.png`;
  await usersService.update(ID, { profile_picture: url });
  assert.equal(usersRepository.update.mock.callCount(), 1);
});

test("update accepts a null profile_picture", async () => {
  await usersService.update(ID, { profile_picture: null });
  assert.equal(usersRepository.update.mock.callCount(), 1);
});

test("update responds 404 when the user does not exist", async () => {
  usersRepository.update.mock.mockImplementation(async () => undefined);
  await assert.rejects(usersService.update(ID, { name: "x" }), status(404, "Usuario no encontrado"));
});
