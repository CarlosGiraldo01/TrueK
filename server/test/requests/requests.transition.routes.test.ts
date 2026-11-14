import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const POST = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "623e4567-e89b-12d3-a456-426614174000";

const makeReq = (status: string) => ({
  id: REQ,
  post_id: POST,
  client_id: CLIENT,
  meeting_address: "Calle 1",
  meeting_date: "2999-01-01T00:00:00.000Z",
  hours: 2,
  status,
  request_image: null,
  payment_confirmed: false,
  price: 20000,
});

const postsRepository = {
  findById: mock.fn(async (_id: string): Promise<Post | undefined> => ({ id: POST, user_id: PROVIDER }) as Post),
};
const requestsRepository = {
  findById: mock.fn(async (_id: string): Promise<unknown> => makeReq("pending")),
  updateStatus: mock.fn(async (_id: string, _e: string, newStatus: string, _n: unknown): Promise<unknown> => ({
    ...makeReq("pending"),
    status: newStatus,
  })),
};

mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/requests/requests.repository", { exports: { requestsRepository } });
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository: {} } });

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
  requestsRepository.findById.mock.mockImplementation(async () => makeReq("pending"));
  requestsRepository.updateStatus.mock.resetCalls();
  requestsRepository.updateStatus.mock.mockImplementation(async (_i, _e, newStatus) => ({
    ...makeReq("pending"),
    status: newStatus,
  }));
});

const patch = (body: unknown, id: string = REQ): Promise<Response> =>
  fetch(`${baseUrl}/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const expectError = async (res: Response, statusCode: number, message: string) => {
  assert.equal(res.status, statusCode);
  const body = (await res.json()) as { message: string };
  assert.equal(body.message, message);
};

test("PATCH /requests/:id responds 200 with provider_id", async () => {
  const res = await patch({ user_id: PROVIDER, action: "accept" });
  const body = (await res.json()) as Record<string, unknown>;

  assert.equal(res.status, 200);
  assert.equal(body.status, "accepted");
  assert.equal(body.provider_id, PROVIDER);
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 1);
});

test("PATCH without user_id responds 400", async () => {
  const res = await patch({ action: "accept" });
  assert.equal(res.status, 400);
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

test("PATCH with non-UUID user_id responds 400", async () => {
  await expectError(await patch({ user_id: "abc", action: "accept" }), 400, "user_id inválido");
});

test("PATCH with non-UUID :id responds 400", async () => {
  await expectError(await patch({ user_id: PROVIDER, action: "accept" }, "nope"), 400, "id de solicitud inválido");
});

test("PATCH with extra status field responds 400", async () => {
  await expectError(
    await patch({ user_id: PROVIDER, action: "accept", status: "finished" }),
    400,
    "Campo no editable: status",
  );
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

test("PATCH with invalid action responds 400", async () => {
  await expectError(await patch({ user_id: PROVIDER, action: "cancel" }), 400, "Acción no válida");
});

test("PATCH accept by the client responds 403", async () => {
  await expectError(await patch({ user_id: CLIENT, action: "accept" }), 403, "Solo el prestador puede aceptar o rechazar");
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

test("PATCH invalid transition responds 409", async () => {
  await expectError(
    await patch({ user_id: PROVIDER, action: "finish" }),
    409,
    'No se puede hacer "finish" con una solicitud en estado "pending"',
  );
});

test("PATCH unknown request responds 404", async () => {
  requestsRepository.findById.mock.mockImplementation(async () => undefined);
  await expectError(await patch({ user_id: PROVIDER, action: "accept" }), 404, "Solicitud no encontrada");
});

test("PATCH race (updateStatus undefined) responds 409", async () => {
  requestsRepository.updateStatus.mock.mockImplementation(async () => undefined);
  await expectError(
    await patch({ user_id: PROVIDER, action: "accept" }),
    409,
    "La solicitud cambió de estado, vuelve a intentarlo",
  );
});

test("GET /requests/transition is unchanged", async () => {
  const res = await fetch(`${baseUrl}/requests/transition?status=pending&action=accept`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "accepted", notification_type: "request_accepted" });
});
