import assert from "node:assert/strict";
import { before, beforeEach, mock, test } from "node:test";
import type { CreateRatingData, Rating } from "../../src/features/ratings/ratings.types";
import type { RequesttWithProvider } from "../../src/features/requests/requests.types";

const CLIENT = "123e4567-e89b-12d3-a456-426614174000";
const PROVIDER = "223e4567-e89b-12d3-a456-426614174000";
const OUTSIDER = "323e4567-e89b-12d3-a456-426614174000";
const REQ = "423e4567-e89b-12d3-a456-426614174000";

const requestsService = {
  getById: mock.fn(async (_id: string): Promise<RequesttWithProvider | undefined> => undefined),
};
const ratingsRepository = {
  findAll: mock.fn(async (): Promise<Rating[]> => []),
  findById: mock.fn(async (): Promise<Rating | undefined> => undefined),
  findByRequestAndRatedUser: mock.fn(
    async (_r: string, _u: string): Promise<Rating | undefined> => undefined,
  ),
  create: mock.fn(async (data: CreateRatingData): Promise<Rating> => ({ id: "new", ...data })),
};

mock.module("../../src/features/requests/requests.service", { exports: { requestsService } });
mock.module("../../src/features/ratings/ratings.repository", { exports: { ratingsRepository } });

let ratingsService: typeof import("../../src/features/ratings/ratings.service").ratingsService;

before(async () => {
  ({ ratingsService } = await import("../../src/features/ratings/ratings.service"));
});

const makeRequest = (over: Partial<RequesttWithProvider> = {}): RequesttWithProvider => ({
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
  ...over,
});

const input = (rater_id: string) => ({ rater_id, service_request_id: REQ, rating: 5 as const, comment: "bien" });

const assertBoom = (status: number, message?: string) => (e: unknown) => {
  const err = e as { isBoom?: boolean; output?: { statusCode: number }; message: string };
  return err.isBoom === true && err.output?.statusCode === status && (message === undefined || err.message === message);
};

beforeEach(() => {
  requestsService.getById.mock.resetCalls();
  ratingsRepository.findByRequestAndRatedUser.mock.resetCalls();
  ratingsRepository.create.mock.resetCalls();
  requestsService.getById.mock.mockImplementation(async () => makeRequest());
  ratingsRepository.findByRequestAndRatedUser.mock.mockImplementation(async () => undefined);
});

test("ratingsService.create rates the provider when the client rates", async () => {
  await ratingsService.create(input(CLIENT));

  assert.deepEqual(ratingsRepository.create.mock.calls[0].arguments[0], {
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 5,
    comment: "bien",
  });
});

test("ratingsService.create rates the client when the provider rates", async () => {
  await ratingsService.create(input(PROVIDER));

  assert.equal(ratingsRepository.create.mock.calls[0].arguments[0].rated_user_id, CLIENT);
});

test("ratingsService.create returns what the repository created", async () => {
  const result = await ratingsService.create(input(CLIENT));

  assert.deepEqual(result, {
    id: "new",
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 5,
    comment: "bien",
  });
});

test("ratingsService.create throws 404 when the request does not exist", async () => {
  requestsService.getById.mock.mockImplementation(async () => undefined);

  await assert.rejects(ratingsService.create(input(CLIENT)), assertBoom(404, "Solicitud no encontrada"));
});

test("ratingsService.create throws 403 when the rater did not take part", async () => {
  await assert.rejects(ratingsService.create(input(OUTSIDER)), assertBoom(403, "No participaste en esta solicitud"));
});

test("ratingsService.create inserts nothing when the rater is an outsider", async () => {
  await assert.rejects(ratingsService.create(input(OUTSIDER)));

  assert.equal(ratingsRepository.create.mock.callCount(), 0);
});

for (const status of ["pending", "accepted", "active", "cancelled", "rejected"] as const) {
  test(`ratingsService.create throws 409 when the request is ${status}`, async () => {
    requestsService.getById.mock.mockImplementation(async () => makeRequest({ status }));

    await assert.rejects(
      ratingsService.create(input(CLIENT)),
      assertBoom(409, "Solo puedes calificar un servicio finalizado"),
    );
  });
}

test("ratingsService.create throws 409 when the request has no provider", async () => {
  requestsService.getById.mock.mockImplementation(async () => makeRequest({ provider_id: null }));

  await assert.rejects(ratingsService.create(input(CLIENT)), assertBoom(409, "La solicitud no tiene prestador"));
});

test("ratingsService.create throws 409 when rating yourself", async () => {
  requestsService.getById.mock.mockImplementation(async () =>
    makeRequest({ client_id: CLIENT, provider_id: CLIENT }),
  );

  await assert.rejects(ratingsService.create(input(CLIENT)), assertBoom(409, "No puedes calificarte a ti mismo"));
});

test("ratingsService.create skips the lookup and insert when rating yourself", async () => {
  requestsService.getById.mock.mockImplementation(async () =>
    makeRequest({ client_id: CLIENT, provider_id: CLIENT }),
  );
  await assert.rejects(ratingsService.create(input(CLIENT)));

  assert.equal(ratingsRepository.findByRequestAndRatedUser.mock.callCount(), 0);
  assert.equal(ratingsRepository.create.mock.callCount(), 0);
});

test("ratingsService.create throws 409 when the service was already rated", async () => {
  ratingsRepository.findByRequestAndRatedUser.mock.mockImplementation(async () => ({
    id: "old",
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 3,
    comment: null,
  }));

  await assert.rejects(ratingsService.create(input(CLIENT)), assertBoom(409, "Ya calificaste este servicio"));
});

test("ratingsService.create does not insert when the service was already rated", async () => {
  ratingsRepository.findByRequestAndRatedUser.mock.mockImplementation(async () => ({
    id: "old",
    service_request_id: REQ,
    rated_user_id: PROVIDER,
    rating: 3,
    comment: null,
  }));
  await assert.rejects(ratingsService.create(input(CLIENT)));

  assert.equal(ratingsRepository.create.mock.callCount(), 0);
});
