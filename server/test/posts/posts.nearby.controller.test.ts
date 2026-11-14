import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_RADIUS_KM, parseNearbyQuery } from "../../src/features/posts/posts.controller";

const MSG = "Parámetros de ubicación inválidos";

const rejects = (query: unknown) =>
  assert.throws(
    () => parseNearbyQuery(query),
    (err: unknown) => {
      const e = err as { isBoom?: boolean; output?: { statusCode: number }; message: string };
      return e.isBoom === true && e.output?.statusCode === 400 && e.message === MSG;
    }
  );

const q = (o: Record<string, unknown>) => ({ lat: "1", lng: "1", radius_km: "1", ...o });

test("MAX_RADIUS_KM is 50", () => {
  assert.equal(MAX_RADIUS_KM, 50);
});

test("parseNearbyQuery returns null when no location params are present", () => {
  assert.equal(parseNearbyQuery({}), null);
  assert.equal(parseNearbyQuery({ other: "x" }), null);
  assert.equal(parseNearbyQuery(undefined), null);
});

test("parseNearbyQuery parses valid params into numbers", () => {
  assert.deepEqual(parseNearbyQuery({ lat: "3.45", lng: "-76.53", radius_km: "6" }), {
    lat: 3.45,
    lng: -76.53,
    radiusKm: 6,
  });
});

test("parseNearbyQuery accepts the boundaries", () => {
  assert.deepEqual(parseNearbyQuery(q({ lat: "90", lng: "180", radius_km: "50" })), {
    lat: 90,
    lng: 180,
    radiusKm: 50,
  });
  assert.deepEqual(parseNearbyQuery(q({ lat: "-90", lng: "-180" })), {
    lat: -90,
    lng: -180,
    radiusKm: 1,
  });
});

const invalidCases: Array<[string, Record<string, unknown>]> = [
  ["radius 0", { radius_km: "0" }],
  ["radius -1", { radius_km: "-1" }],
  ["radius 50.1", { radius_km: "50.1" }],
  ["lat 90.1", { lat: "90.1" }],
  ["lat -90.1", { lat: "-90.1" }],
  ["lng 180.1", { lng: "180.1" }],
  ["lng -180.1", { lng: "-180.1" }],
  ["lat abc", { lat: "abc" }],
  ["lng empty", { lng: "" }],
  ["radius whitespace", { radius_km: "   " }],
  ["lat Infinity", { lat: "Infinity" }],
  ["lng NaN", { lng: "NaN" }],
  ["lat array", { lat: ["1", "2"] }],
  ["radius array", { radius_km: ["1"] }],
  ["lat nested object", { lat: { a: "1" } }],
];

for (const [name, override] of invalidCases) {
  test(`parseNearbyQuery rejects ${name} with 400`, () => {
    rejects(q(override));
  });
}

test("parseNearbyQuery rejects partial filters with 400", () => {
  rejects({ lat: "1" });
  rejects({ lat: "1", lng: "1" });
  rejects({ lng: "1", radius_km: "1" });
  rejects({ radius_km: "1" });
});
