import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { Post } from "../../src/features/posts/posts.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const POST = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "623e4567-e89b-12d3-a456-426614174000";

const makeReq = (status: string, paid = false) => ({
  id: REQ,
  post_id: POST,
  client_id: CLIENT,
  meeting_address: "Calle 1",
  meeting_date: "2999-01-01T00:00:00.000Z",
  hours: 2,
  status,
  request_image: null,
  payment_confirmed: paid,
  price: 20000,
});

// El socket se simula: los tests no se conectan a Supabase
const realtime = {
  NOTIFICATION_EVENT: "new-notification",
  PAYMENT_EVENT: "payment-confirmed",
  broadcastToUser: mock.fn(async (_userId: string, _event: string, _payload: object): Promise<void> => undefined),
};
const postsRepository = {
  findById: mock.fn(async (_id: string): Promise<Post | undefined> => ({ id: POST, user_id: PROVIDER }) as Post),
};
const requestsRepository = {
  findById: mock.fn(async (_id: string): Promise<unknown> => makeReq("finished")),
  confirmPayment: mock.fn(async (_id: string): Promise<unknown> => makeReq("finished", true)),
};

mock.module("../../src/config/realtime", { exports: realtime });
mock.module("../../src/features/posts/posts.repository", { exports: { postsRepository } });
mock.module("../../src/features/requests/requests.repository", { exports: { requestsRepository } });
mock.module("../../src/features/uploads/uploads.repository", { exports: { uploadsRepository: {} } });

let requestsService: typeof import("../../src/features/requests/requests.service").requestsService;

before(async () => {
  ({ requestsService } = await import("../../src/features/requests/requests.service"));
});

beforeEach(() => {
  requestsRepository.findById.mock.mockImplementation(async () => makeReq("finished"));
  requestsRepository.confirmPayment.mock.resetCalls();
  requestsRepository.confirmPayment.mock.mockImplementation(async () => makeReq("finished", true));
  realtime.broadcastToUser.mock.resetCalls();
});

const fail = (code: number, message: string) => (err: unknown) => {
  const e = err as { output?: { statusCode: number }; message: string };
  assert.equal(e.output?.statusCode, code);
  assert.equal(e.message, message);
  return true;
};

test("the client pays a finished service and the provider is told by socket", async () => {
  const result = await requestsService.pay(CLIENT, REQ);

  assert.equal(result.payment_confirmed, true);
  assert.equal(requestsRepository.confirmPayment.mock.callCount(), 1);
  assert.deepEqual(realtime.broadcastToUser.mock.calls[0].arguments, [PROVIDER, "payment-confirmed", result]);
});

test("only the client can pay", async () => {
  await assert.rejects(requestsService.pay(PROVIDER, REQ), fail(403, "Solo el cliente puede pagar este servicio"));
  assert.equal(requestsRepository.confirmPayment.mock.callCount(), 0);
});

test("a service that has not finished cannot be paid", async () => {
  requestsRepository.findById.mock.mockImplementation(async () => makeReq("accepted"));

  await assert.rejects(requestsService.pay(CLIENT, REQ), fail(409, "El servicio aún no ha terminado"));
});

test("a service cannot be paid twice", async () => {
  requestsRepository.findById.mock.mockImplementation(async () => makeReq("finished", true));

  await assert.rejects(requestsService.pay(CLIENT, REQ), fail(409, "Este servicio ya fue pagado"));
  assert.equal(realtime.broadcastToUser.mock.callCount(), 0);
});

test("responds 404 when the request does not exist", async () => {
  requestsRepository.findById.mock.mockImplementation(async () => undefined);

  await assert.rejects(requestsService.pay(CLIENT, REQ), fail(404, "Solicitud no encontrada"));
});
