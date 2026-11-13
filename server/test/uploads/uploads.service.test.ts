import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";

const BASE = "https://test-project.supabase.co/storage/v1/object/public/images/";
const uploadsRepository = {
  upload: mock.fn(async (_p: string, _b: Buffer, _c: string): Promise<void> => undefined),
  getPublicUrl: mock.fn((path: string): string => `${BASE}${path}`),
};
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository } });

let svc: typeof import("../../src/features/uploads/uploads.service");

before(async () => {
  svc = await import("../../src/features/uploads/uploads.service");
});

beforeEach(() => {
  uploadsRepository.upload.mock.resetCalls();
  uploadsRepository.upload.mock.mockImplementation(async () => undefined);
});

const USER = "123e4567-e89b-12d3-a456-426614174000";
const OTHER = "223e4567-e89b-12d3-a456-426614174000";
const uuidV4 = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

const fakeFile = (mimetype: string, buffer: Buffer = Buffer.from("a")): Express.Multer.File =>
  ({ buffer, mimetype }) as Express.Multer.File;

test("buildImagePath matches userId/uuid.ext for each mime", () => {
  const cases: Array<[string, string]> = [
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
  ];
  for (const [mime, ext] of cases) {
    assert.match(svc.buildImagePath(USER, mime), new RegExp(`^${USER}/${uuidV4}\\.${ext}$`));
  }
});

test("buildImagePath gives different names on each call", () => {
  assert.notEqual(svc.buildImagePath(USER, "image/png"), svc.buildImagePath(USER, "image/png"));
});

test("uploadImage uploads the buffer with its mimetype", async () => {
  const buffer = Buffer.from("abc");
  await svc.uploadsService.uploadImage(USER, fakeFile("image/png", buffer));

  const [path, buf, type] = uploadsRepository.upload.mock.calls[0].arguments;
  assert.match(path, new RegExp(`^${USER}/${uuidV4}\\.png$`));
  assert.equal(buf, buffer);
  assert.equal(type, "image/png");
});

test("uploadImage returns the public url and path", async () => {
  const result = await svc.uploadsService.uploadImage(USER, fakeFile("image/webp"));

  assert.equal(result.url, `${BASE}${result.path}`);
});

test("uploadImage maps repository errors to 502", async () => {
  uploadsRepository.upload.mock.mockImplementation(async () => {
    throw new Error("boom");
  });
  const errorMock = mock.method(console, "error", () => undefined);
  try {
    await assert.rejects(
      () => svc.uploadsService.uploadImage(USER, fakeFile("image/png")),
      (err: { output?: { statusCode: number; payload: { message: string } } }) =>
        err.output?.statusCode === 502 &&
        err.output.payload.message === "No se pudo guardar la imagen",
    );
  } finally {
    errorMock.mock.restore();
  }
});

test("isUserImageUrl accepts a url in the user's own folder", () => {
  assert.equal(svc.uploadsService.isUserImageUrl(`${BASE}${USER}/11111111-1111-4111-8111-111111111111.png`, USER), true);
});

test("isUserImageUrl rejects a url in another user's folder", () => {
  assert.equal(svc.uploadsService.isUserImageUrl(`${BASE}${OTHER}/11111111-1111-4111-8111-111111111111.png`, USER), false);
});

test("isUserImageUrl rejects a folder that only shares the user id as prefix", () => {
  assert.equal(svc.uploadsService.isUserImageUrl(`${BASE}${USER}-evil/11111111-1111-4111-8111-111111111111.png`, USER), false);
});

test("isUserImageUrl rejects an external url", () => {
  assert.equal(svc.uploadsService.isUserImageUrl("https://evil.example.com/a.png", USER), false);
});

const FILE = "11111111-1111-4111-8111-111111111111";
const is = (url: string, userId: string = USER): boolean =>
  svc.uploadsService.isUserImageUrl(url, userId);

test("isUserImageUrl accepts own uuid png, jpg and webp", () => {
  for (const ext of ["png", "jpg", "webp"]) {
    assert.equal(is(`${BASE}${USER}/${FILE}.${ext}`), true, ext);
  }
});

test("isUserImageUrl rejects a dot-segment traversal into another folder", () => {
  assert.equal(is(`${BASE}${USER}/../${OTHER}/${FILE}.png`), false);
});

test("isUserImageUrl rejects an encoded dot-segment traversal", () => {
  assert.equal(is(`${BASE}${USER}/%2e%2e/${OTHER}/${FILE}.png`), false);
});

test("isUserImageUrl rejects a query string", () => {
  assert.equal(is(`${BASE}${USER}/${FILE}.png?x=1`), false);
});

test("isUserImageUrl rejects a fragment", () => {
  assert.equal(is(`${BASE}${USER}/${FILE}.png#frag`), false);
});

test("isUserImageUrl rejects a nested subfolder", () => {
  assert.equal(is(`${BASE}${USER}/sub/${FILE}.png`), false);
});

test("isUserImageUrl rejects a gif extension", () => {
  assert.equal(is(`${BASE}${USER}/${FILE}.gif`), false);
});

test("isUserImageUrl rejects a file name that is not a uuid", () => {
  assert.equal(is(`${BASE}${USER}/not-a-uuid.png`), false);
});

test("isUserImageUrl rejects a userId that is not a uuid", () => {
  assert.equal(is(`${BASE}u1/${FILE}.png`, "u1"), false);
});
