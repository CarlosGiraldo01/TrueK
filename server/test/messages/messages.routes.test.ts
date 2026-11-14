import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { CreateMessageInput, Message } from "../../src/features/messages/messages.types";
import type { RequesttWithProvider } from "../../src/features/requests/requests.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const OUTSIDER = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "423e4567-e89b-12d3-a456-426614174000";

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

const requestsService = {
  getById: mock.fn(async (_id: string): Promise<RequesttWithProvider | undefined> => makeRequest()),
};
const messagesRepository = {
  findAll: mock.fn(async (_requestId?: string): Promise<Message[]> => []),
  findById: mock.fn(async (): Promise<Message | undefined> => undefined),
  create: mock.fn(
    async (d: CreateMessageInput): Promise<Message> => ({
      id: "new",
      service_request_id: d.service_request_id,
      sender_id: d.sender_id,
      content: d.content,
      created_at: "2026-01-01T00:00:00Z",
    }),
  ),
};

mock.module("../../src/features/requests/requests.service", { exports: { requestsService } });
mock.module("../../src/features/messages/messages.repository", { exports: { messagesRepository } });

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
  messagesRepository.create.mock.resetCalls();
  requestsService.getById.mock.mockImplementation(async () => makeRequest());
});

const valid = { user_id: CLIENT, service_request_id: REQ, content: " hola " };

const post = (body: unknown): Promise<Response> =>
  fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("POST /messages responds 201 with the created message", async () => {
  const res = await post(valid);

  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), {
    id: "new",
    service_request_id: REQ,
    sender_id: CLIENT,
    content: "hola",
    created_at: "2026-01-01T00:00:00Z",
  });
});

test("POST /messages responds 400 Falta user_id when user_id is missing", async () => {
  const { user_id: _omit, ...rest } = valid;
  const res = await post(rest);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { statusCode: 400, error: "Bad Request", message: "Falta user_id" });
});

test("POST /messages responds 400 with a Boom payload for empty content", async () => {
  const res = await post({ ...valid, content: "   " });

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "El mensaje no puede estar vacío",
  });
});

test("POST /messages responds 403 when the caller took no part in the request", async () => {
  const res = await post({ ...valid, user_id: OUTSIDER });

  assert.equal(res.status, 403);
  assert.equal(messagesRepository.create.mock.callCount(), 0);
});

test("POST /messages responds 409 when the request is cancelled", async () => {
  requestsService.getById.mock.mockImplementation(async () => makeRequest({ status: "cancelled" }));
  const res = await post(valid);

  assert.equal(res.status, 409);
});

test("POST /messages responds 404 when the request does not exist", async () => {
  requestsService.getById.mock.mockImplementation(async () => undefined);
  const res = await post(valid);

  assert.equal(res.status, 404);
});

test("GET /messages still responds the repository list for a request", async () => {
  const list: Message[] = [
    { id: "1", service_request_id: REQ, sender_id: CLIENT, content: "a", created_at: "2026-01-01T00:00:00Z" },
  ];
  messagesRepository.findAll.mock.mockImplementationOnce(async () => list);
  const res = await fetch(`${baseUrl}/messages?service_request_id=${REQ}`);

  assert.deepEqual(await res.json(), list);
});
