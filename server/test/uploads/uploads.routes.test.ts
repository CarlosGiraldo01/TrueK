import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { Request } from "express";

const BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";
const uploadsRepository = {
  upload: mock.fn(async (_p: string, _b: Buffer, _c: string): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${BASE}${path}`),
};
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });

const USER = "123e4567-e89b-12d3-a456-426614174000";
const uuidV4 = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const MAX = 5 * 1024 * 1024;

let server: Server;
let baseUrl: string;
let imageFileFilter: typeof import("../../src/features/uploads/uploads.router").imageFileFilter;

before(async () => {
  ({ imageFileFilter } = await import("../../src/features/uploads/uploads.router"));
  const { app } = await import("../../src/app");
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  uploadsRepository.upload.mock.resetCalls();
});

const form = (parts: Array<[string, Blob, string]>): FormData => {
  const fd = new FormData();
  for (const [name, blob, filename] of parts) fd.append(name, blob, filename);
  return fd;
};

const send = (query: string, body: FormData): Promise<Response> =>
  fetch(`${baseUrl}/uploads/images${query}`, { method: "POST", body });

const png = (size = 10): Blob => new Blob([new Uint8Array(size)], { type: "image/png" });

const messageOf = async (res: Response): Promise<string> =>
  ((await res.json()) as { message: string }).message;

test("imageFileFilter accepts png, jpeg and webp", () => {
  for (const mimetype of ["image/png", "image/jpeg", "image/webp"]) {
    const cb = mock.fn();
    imageFileFilter({} as Request, { mimetype } as Express.Multer.File, cb);
    assert.deepEqual(cb.mock.calls[0].arguments, [null, true], mimetype);
  }
});

test("imageFileFilter rejects gif, pdf and svg with Boom 415", () => {
  for (const mimetype of ["image/gif", "application/pdf", "image/svg+xml"]) {
    const cb = mock.fn();
    imageFileFilter({} as Request, { mimetype } as Express.Multer.File, cb);
    const err = cb.mock.calls[0].arguments[0] as { output: { statusCode: number } };
    assert.equal(err.output.statusCode, 415, mimetype);
  }
});

test("POST /uploads/images responds 201 with a path in the user's folder", async () => {
  const res = await send(`?user_id=${USER}`, form([["file", png(), "a.png"]]));
  const body = (await res.json()) as { url: string; path: string };

  assert.equal(res.status, 201);
  assert.match(body.path, new RegExp(`^${USER}/${uuidV4}\\.png$`));
});

test("POST /uploads/images returns the public url of the path", async () => {
  const res = await send(`?user_id=${USER}`, form([["file", png(), "a.png"]]));
  const body = (await res.json()) as { url: string; path: string };

  assert.equal(body.url, `${BASE}${body.path}`);
});

test("POST /uploads/images responds 400 Falta user_id when missing", async () => {
  const res = await send("", form([["file", png(), "a.png"]]));

  assert.equal(res.status, 400);
  assert.equal(await messageOf(res), "Falta user_id");
});

test("POST /uploads/images responds 400 user_id inválido for a non-uuid", async () => {
  const res = await send("?user_id=..%2Fx", form([["file", png(), "a.png"]]));

  assert.equal(res.status, 400);
  assert.equal(await messageOf(res), "user_id inválido");
});

test("POST /uploads/images does not upload when user_id is invalid", async () => {
  await send("?user_id=..%2Fx", form([["file", png(), "a.png"]]));

  assert.equal(uploadsRepository.upload.mock.callCount(), 0);
});

test("POST /uploads/images responds 400 when there is no file", async () => {
  const fd = new FormData();
  fd.append("other", "x");
  const res = await send(`?user_id=${USER}`, fd);

  assert.equal(res.status, 400);
  assert.equal(await messageOf(res), 'Falta la imagen en el campo "file"');
});

test("POST /uploads/images responds 415 for a text/plain file", async () => {
  const res = await send(
    `?user_id=${USER}`,
    form([["file", new Blob(["x"], { type: "text/plain" }), "a.txt"]]),
  );

  assert.equal(res.status, 415);
  assert.equal(await messageOf(res), "Solo se permiten imágenes png, jpeg o webp");
});

test("POST /uploads/images responds 415 for a gif and does not upload", async () => {
  const res = await send(
    `?user_id=${USER}`,
    form([["file", new Blob(["x"], { type: "image/gif" }), "a.gif"]]),
  );

  assert.equal(res.status, 415);
  assert.equal(uploadsRepository.upload.mock.callCount(), 0);
});

test("POST /uploads/images accepts a file of exactly 5 MB", async () => {
  const res = await send(`?user_id=${USER}`, form([["file", png(MAX), "a.png"]]));

  assert.equal(res.status, 201);
});

test("POST /uploads/images responds 413 for a file just over 5 MB", async () => {
  const res = await send(`?user_id=${USER}`, form([["file", png(MAX + 1), "a.png"]]));

  assert.equal(res.status, 413);
  assert.equal(await messageOf(res), "La imagen supera el tamaño máximo de 5 MB");
});

test("POST /uploads/images responds 400 for two files", async () => {
  const res = await send(
    `?user_id=${USER}`,
    form([
      ["file", png(), "a.png"],
      ["file", png(), "b.png"],
    ]),
  );

  assert.equal(res.status, 400);
});

test("POST /uploads/images responds 400 for the wrong field name", async () => {
  const res = await send(`?user_id=${USER}`, form([["image", png(), "a.png"]]));

  assert.equal(res.status, 400);
});
