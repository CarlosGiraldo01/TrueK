import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, mock, test } from "node:test";
import { resetGeocodeStateForTests } from "../../src/features/geo/geo.service";

let server: Server;
let baseUrl: string;
const realFetch = globalThis.fetch;
let nominatim: (url: string) => Promise<Response>;
let nominatimCalls: string[] = [];

before(async () => {
  const { app } = await import("../../src/app");
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  resetGeocodeStateForTests();
  nominatimCalls = [];
  mock.method(console, "error", () => undefined);
  nominatim = async () =>
    new Response(JSON.stringify([{ lat: "3.45", lon: "-76.53", display_name: "Cali" }]), { status: 200 });
  // Local calls go to the real fetch; anything else is the Nominatim mock.
  mock.method(globalThis, "fetch", (async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("http://127.0.0.1")) return realFetch(input, init);
    nominatimCalls.push(url);
    return nominatim(url);
  }) as typeof fetch);
});

afterEach(() => {
  mock.restoreAll();
});

const get = (qs: string): Promise<Response> => realFetch(`${baseUrl}/geocode${qs}`);

test("GET /geocode returns 200 with coordinates", async () => {
  const res = await get("?q=Cali");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { latitude: 3.45, longitude: -76.53, display_name: "Cali" });
});

test("GET /geocode passes the trimmed q upstream", async () => {
  const res = await get("?q=%20%20Cali%20centro%20%20");
  assert.equal(res.status, 200);
  assert.equal(new URL(nominatimCalls[0]).searchParams.get("q"), "Cali centro");
});

for (const [name, qs] of [
  ["missing q", ""],
  ["short q", "?q=ab"],
  ["whitespace-padded short q", "?q=%20%20%20ab%20%20%20"],
  ["empty q", "?q="],
  ["q repeated as array", "?q=abc&q=def"],
] as const) {
  test(`GET /geocode ${name} -> 400`, async () => {
    const res = await get(qs);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { message: string };
    assert.equal(body.message, "El parámetro q es obligatorio y debe tener al menos 3 caracteres");
    assert.equal(nominatimCalls.length, 0);
  });
}

test("GET /geocode 200-char q is accepted, 201-char q -> 400", async () => {
  assert.equal((await get(`?q=${"a".repeat(200)}`)).status, 200);
  const res = await get(`?q=${"a".repeat(201)}`);
  assert.equal(res.status, 400);
  const body = (await res.json()) as { message: string };
  assert.equal(body.message, "El parámetro q no puede superar 200 caracteres");
});

test("GET /geocode upstream failure -> 502", async () => {
  nominatim = async () => {
    throw new Error("boom internal");
  };
  const res = await get("?q=Cali");
  assert.equal(res.status, 502);
  const text = await res.text();
  assert.ok(text.includes("No se pudo conectar con el servicio de geocodificación"));
  assert.ok(!text.includes("boom internal"));
});

test("GET /geocode not found -> 404", async () => {
  nominatim = async () => new Response("[]", { status: 200 });
  const res = await get("?q=zzzzzz");
  assert.equal(res.status, 404);
  const body = (await res.json()) as { message: string };
  assert.equal(body.message, "No se encontró esa dirección");
});
