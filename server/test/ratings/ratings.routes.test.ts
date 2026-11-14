import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, mock, test } from "node:test";
import type { CreateRatingData, Rating } from "../../src/features/ratings/ratings.types";
import type { RequesttWithProvider } from "../../src/features/requests/requests.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const OUTSIDER = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "423e4567-e89b-12d3-a456-426614174000";

const makeRequest = (): RequesttWithProvider => ({
  id: REQ,
  post_id: "p1",
  client_id: CLIENT,
  provider_id: PROVIDER,
  meeting_address: "x",
  meeting_date: "2026-01-01T10:00",
  hours: 1,
  status: "finished",
  request_image: null,
  payment_confirmed: false,
  price: 100,
});

const requestsService = {
  getById: mock.fn(async (_id: string): Promise<RequesttWithProvider | undefined> => makeRequest()),
};
const ratingsRepository = {
  findAll: mock.fn(async (): Promise<Rating[]> => []),
  findById: mock.fn(async (): Promise<Rating | undefined> => undefined),
  findByRequestAndRatedUser: mock.fn(async (_r: string, _u: string): Promise<Rating | undefined> => undefined),
  create: mock.fn(async (d: CreateRatingData): Promise<Rating> => ({ id: "new", ...d })),
};

mock.module("../../src/features/requests/requests.service", { exports: { requestsService } });
mock.module("../../src/features/ratings/ratings.repository", { exports: { ratingsRepository } });

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
  ratingsRepository.create.mock.resetCalls();
  requestsService.getById.mock.mockImplementation(async () => makeRequest());
  ratingsRepository.findByRequestAndRatedUser.mock.mockImplementation(async () => undefined);
});

const valid = { user_id: CLIENT, service_request_id: REQ, rating: 5, comment: " genial " };

const post = (body: unknown): Promise<Response> =>
  fetch(`${baseUrl}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("POST /ratings responds 201 with the created rating", async () => {
  const res = await post(valid);

  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), {
    id: "new",
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 5,
    comment: "genial",
  });
});

test("POST /ratings responds 400 Falta user_id when user_id is missing", async () => {
  const { user_id: _omit, ...rest } = valid;
  const res = await post(rest);

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { statusCode: 400, error: "Bad Request", message: "Falta user_id" });
});

test("POST /ratings responds 400 with a Boom payload for an invalid rating", async () => {
  const res = await post({ ...valid, rating: 9 });

  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "El campo rating debe ser un entero entre 1 y 5",
  });
});

test("POST /ratings responds 403 when the caller took no part in the request", async () => {
  const res = await post({ ...valid, user_id: OUTSIDER });

  assert.equal(res.status, 403);
  assert.equal(ratingsRepository.create.mock.callCount(), 0);
});

test("POST /ratings responds 409 when the service was already rated", async () => {
  ratingsRepository.findByRequestAndRatedUser.mock.mockImplementation(async () => ({
    id: "old",
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 3,
    comment: null,
  }));
  const res = await post(valid);

  assert.equal(res.status, 409);
});

test("POST /ratings responds 404 when the request does not exist", async () => {
  requestsService.getById.mock.mockImplementation(async () => undefined);
  const res = await post(valid);

  assert.equal(res.status, 404);
});

test("GET /ratings/averages still responds the per-user means", async () => {
  ratingsRepository.findAll.mock.mockImplementationOnce(async () => [
    { id: "1", service_request_id: "a", rated_user_id: "u1", rating: 5, comment: null },
    { id: "2", service_request_id: "b", rated_user_id: "u1", rating: 3, comment: null },
  ]);
  const res = await fetch(`${baseUrl}/ratings/averages`);

  assert.deepEqual(await res.json(), { u1: 4 });
});
