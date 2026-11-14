import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { CreateMessageInput, Message } from "../../src/features/messages/messages.types";
import type { RequesttWithProvider } from "../../src/features/requests/requests.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const OUTSIDER = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "423e4567-e89b-12d3-a456-426614174000";

const requestsService = {
  getById: mock.fn(async (_id: string): Promise<RequesttWithProvider | undefined> => undefined),
};
const messagesRepository = {
  findAll: mock.fn(async (): Promise<Message[]> => []),
  findById: mock.fn(async (): Promise<Message | undefined> => undefined),
  create: mock.fn(
    async (d: CreateMessageInput): Promise<Message> => ({
      id: "m1",
      service_request_id: d.service_request_id,
      sender_id: d.sender_id,
      content: d.content,
      created_at: "2026-01-01T00:00:00Z",
    }),
  ),
};

mock.module("../../src/features/requests/requests.service", { exports: { requestsService } });
mock.module("../../src/features/messages/messages.repository", { exports: { messagesRepository } });

let messagesService: typeof import("../../src/features/messages/messages.service").messagesService;

before(async () => {
  ({ messagesService } = await import("../../src/features/messages/messages.service"));
});

const makeRequest = (over: Partial<RequesttWithProvider> = {}): RequesttWithProvider => ({
  id: REQ,
  post_id: "p1",
  client_id: CLIENT,
  provider_id: PROVIDER,
  meeting_address: "x",
  meeting_date: "2026-01-01T10:00",
  hours: 1,
  status: "active",
  request_image: null,
  payment_confirmed: false,
  price: 100,
  ...over,
});

const input = (sender_id: string): CreateMessageInput => ({ sender_id, service_request_id: REQ, content: "hola" });

const assertBoom = (status: number, message: string) => (e: unknown) => {
  const err = e as { isBoom?: boolean; output?: { statusCode: number }; message: string };
  return err.isBoom === true && err.output?.statusCode === status && err.message === message;
};

beforeEach(() => {
  requestsService.getById.mock.resetCalls();
  messagesRepository.create.mock.resetCalls();
  requestsService.getById.mock.mockImplementation(async () => makeRequest());
});

test("messagesService.create stores the message with the client as sender", async () => {
  await messagesService.create(input(CLIENT));

  assert.deepEqual(messagesRepository.create.mock.calls[0].arguments[0], {
    service_request_id: REQ,
    sender_id: CLIENT,
    content: "hola",
  });
});

test("messagesService.create lets the provider send", async () => {
  await messagesService.create(input(PROVIDER));

  assert.equal(messagesRepository.create.mock.calls[0].arguments[0].sender_id, PROVIDER);
});

test("messagesService.create returns what the repository created", async () => {
  assert.deepEqual(await messagesService.create(input(CLIENT)), {
    id: "m1",
    service_request_id: REQ,
    sender_id: CLIENT,
    content: "hola",
    created_at: "2026-01-01T00:00:00Z",
  });
});

for (const status of ["pending", "accepted", "active", "finished"] as const) {
  test(`messagesService.create allows messages when the request is ${status}`, async () => {
    requestsService.getById.mock.mockImplementation(async () => makeRequest({ status }));
    await messagesService.create(input(CLIENT));

    assert.equal(messagesRepository.create.mock.callCount(), 1);
  });
}

for (const status of ["cancelled", "rejected"] as const) {
  test(`messagesService.create throws 409 when the request is ${status}`, async () => {
    requestsService.getById.mock.mockImplementation(async () => makeRequest({ status }));

    await assert.rejects(
      messagesService.create(input(CLIENT)),
      assertBoom(409, "No puedes enviar mensajes en una solicitud cancelada o rechazada"),
    );
  });

  test(`messagesService.create does not insert when the request is ${status}`, async () => {
    requestsService.getById.mock.mockImplementation(async () => makeRequest({ status }));
    await assert.rejects(messagesService.create(input(CLIENT)));

    assert.equal(messagesRepository.create.mock.callCount(), 0);
  });
}

test("messagesService.create throws 404 when the request does not exist", async () => {
  requestsService.getById.mock.mockImplementation(async () => undefined);

  await assert.rejects(messagesService.create(input(CLIENT)), assertBoom(404, "Solicitud no encontrada"));
});

test("messagesService.create throws 403 when the sender did not take part", async () => {
  await assert.rejects(
    messagesService.create(input(OUTSIDER)),
    assertBoom(403, "No participaste en esta solicitud"),
  );
});

test("messagesService.create does not insert when the sender is an outsider", async () => {
  await assert.rejects(messagesService.create(input(OUTSIDER)));

  assert.equal(messagesRepository.create.mock.callCount(), 0);
});
