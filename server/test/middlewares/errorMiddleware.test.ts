import { after, afterEach, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import Boom from "@hapi/boom";
import express from "express";
import { errorHandler } from "../../src/middlewares/errorMiddleware";

// App mínima con el errorHandler real; ninguna ruta del app real lanza errores todavía.
const testApp = express();
testApp.use(express.json());
testApp.get("/boom", () => {
  throw Boom.badRequest("Falta user_id");
});
testApp.get("/crash", () => {
  throw new Error("connection to db.internal:5432 failed at /srv/secret.ts");
});
testApp.get("/async-crash", async () => {
  throw new Error("password authentication failed for user postgres");
});
testApp.post("/json", (_req, res) => {
  res.json({ ok: true });
});
testApp.use(errorHandler);

let server: Server;
let baseUrl: string;

before(async () => {
  server = testApp.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(() => {
  mock.restoreAll();
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("errorHandler responds with the Boom status code", async () => {
  const response = await fetch(`${baseUrl}/boom`);
  assert.equal(response.status, 400);
});

test("errorHandler responds with the Boom payload", async () => {
  const response = await fetch(`${baseUrl}/boom`);
  assert.deepEqual(await response.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "Falta user_id",
  });
});

test("errorHandler turns a non-Boom error into a 500", async () => {
  mock.method(console, "error", () => {});
  const response = await fetch(`${baseUrl}/crash`);
  assert.equal(response.status, 500);
});

test("errorHandler does not leak the message or stack of a non-Boom error", async () => {
  mock.method(console, "error", () => {});
  const response = await fetch(`${baseUrl}/crash`);
  assert.deepEqual(await response.json(), {
    statusCode: 500,
    error: "Internal Server Error",
    message: "An internal server error occurred",
  });
});

test("errorHandler hides errors rejected from async handlers", async () => {
  mock.method(console, "error", () => {});
  const response = await fetch(`${baseUrl}/async-crash`);
  assert.deepEqual(await response.json(), {
    statusCode: 500,
    error: "Internal Server Error",
    message: "An internal server error occurred",
  });
});

test("errorHandler keeps malformed JSON bodies as a 400 instead of a 500", async () => {
  const response = await fetch(`${baseUrl}/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not json",
  });
  assert.equal(response.status, 400);
});
