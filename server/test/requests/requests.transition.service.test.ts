import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const POST = "323e4567-e89b-12d3-a456-426614174000";
const OUTSIDER = "523e4567-e89b-12d3-a456-426614174000";
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

let requestsService: typeof import("../../src/features/requests/requests.service").requestsService;

before(async () => {
  ({ requestsService } = await import("../../src/features/requests/requests.service"));
});

const setStatus = (status: string) => requestsRepository.findById.mock.mockImplementation(async () => makeReq(status));

beforeEach(() => {
  postsRepository.findById.mock.mockImplementation(async () => ({ id: POST, user_id: PROVIDER }) as Post);
  requestsRepository.findById.mock.mockImplementation(async () => makeReq("pending"));
  requestsRepository.updateStatus.mock.resetCalls();
  requestsRepository.updateStatus.mock.mockImplementation(async (_i, _e, newStatus) => ({
    ...makeReq("pending"),
    status: newStatus,
  }));
});

const fail = (code: number, message: string) => (err: unknown) => {
  const e = err as { output?: { statusCode: number }; message: string };
  assert.equal(e.output?.statusCode, code);
  assert.equal(e.message, message);
  return true;
};

test("provider accepts a pending request and notifies the client", async () => {
  const result = (await requestsService.transition(PROVIDER, REQ, "accept")) as unknown as Record<string, unknown>;

  assert.equal(requestsRepository.updateStatus.mock.callCount(), 1);
  assert.deepEqual(requestsRepository.updateStatus.mock.calls[0].arguments, [
    REQ,
    "pending",
    "accepted",
    { user_id: CLIENT, type: "request_accepted", message: "Ha aceptado tu solicitud" },
  ]);
  assert.equal(result.status, "accepted");
  assert.equal(result.provider_id, PROVIDER);
});

test("provider rejects a pending request and notifies the client", async () => {
  await requestsService.transition(PROVIDER, REQ, "reject");

  assert.deepEqual(requestsRepository.updateStatus.mock.calls[0].arguments, [
    REQ,
    "pending",
    "rejected",
    { user_id: CLIENT, type: "request_rejected", message: "Ha rechazado tu solicitud" },
  ]);
});

test("client finishes an accepted request and the provider is notified", async () => {
  setStatus("accepted");
  await requestsService.transition(CLIENT, REQ, "finish");

  assert.deepEqual(requestsRepository.updateStatus.mock.calls[0].arguments, [
    REQ,
    "accepted",
    "finished",
    { user_id: PROVIDER, type: "services_finished", message: "Tu servicio ha terminado!" },
  ]);
});

test("provider finishes an active request and the client is notified", async () => {
  setStatus("active");
  await requestsService.transition(PROVIDER, REQ, "finish");

  assert.deepEqual(requestsRepository.updateStatus.mock.calls[0].arguments, [
    REQ,
    "active",
    "finished",
    { user_id: CLIENT, type: "services_finished", message: "Tu servicio ha terminado!" },
  ]);
});

for (const action of ["accept", "reject"] as const) {
  test(`client cannot ${action} (403)`, async () => {
    await assert.rejects(
      requestsService.transition(CLIENT, REQ, action),
      fail(403, "Solo el prestador puede aceptar o rechazar"),
    );
    assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
  });

  test(`outsider cannot ${action} (403)`, async () => {
    await assert.rejects(
      requestsService.transition(OUTSIDER, REQ, action),
      fail(403, "Solo el prestador puede aceptar o rechazar"),
    );
    assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
  });
}

test("outsider cannot finish (403)", async () => {
  setStatus("accepted");
  await assert.rejects(
    requestsService.transition(OUTSIDER, REQ, "finish"),
    fail(403, "No tienes permiso sobre esta solicitud"),
  );
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

const invalid: Array<[string, "accept" | "reject" | "finish"]> = [
  ["accepted", "accept"],
  ["finished", "reject"],
  ["pending", "finish"],
];
for (const [status, action] of invalid) {
  test(`${action} on ${status} responds 409`, async () => {
    setStatus(status);
    await assert.rejects(
      requestsService.transition(PROVIDER, REQ, action),
      fail(409, `No se puede hacer "${action}" con una solicitud en estado "${status}"`),
    );
    assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
  });
}

test("unknown request responds 404", async () => {
  requestsRepository.findById.mock.mockImplementation(async () => undefined);
  await assert.rejects(requestsService.transition(PROVIDER, REQ, "accept"), fail(404, "Solicitud no encontrada"));
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

test("missing post responds 404", async () => {
  postsRepository.findById.mock.mockImplementation(async () => undefined);
  await assert.rejects(requestsService.transition(PROVIDER, REQ, "accept"), fail(404, "Publicación no encontrada"));
  assert.equal(requestsRepository.updateStatus.mock.callCount(), 0);
});

test("race: updateStatus returning undefined responds 409", async () => {
  requestsRepository.updateStatus.mock.mockImplementation(async () => undefined);
  await assert.rejects(
    requestsService.transition(PROVIDER, REQ, "accept"),
    fail(409, "La solicitud cambió de estado, vuelve a intentarlo"),
  );
});
