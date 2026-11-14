import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import {
  GEOCODE_CACHE_MAX_ENTRIES,
  geoService,
  resetGeocodeStateForTests,
} from "../../src/features/geo/geo.service";

type Mocked = ReturnType<typeof mock.method>;
let fetchMock: Mocked;
let consoleMock: Mocked;

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const hit = (over: Record<string, unknown> = {}) => ({
  lat: "3.4516",
  lon: "-76.5320",
  display_name: "Cali, Valle",
  ...over,
});

const mockFetch = (impl: (url: string, init: RequestInit) => Promise<Response>): void => {
  fetchMock = mock.method(globalThis, "fetch", impl as unknown as typeof fetch);
};

const call = (i: number): [string, RequestInit] =>
  fetchMock.mock.calls[i].arguments as unknown as [string, RequestInit];

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

interface BoomLike {
  isBoom: boolean;
  message: string;
  output: { statusCode: number; payload: unknown };
}

beforeEach(() => {
  resetGeocodeStateForTests();
  consoleMock = mock.method(console, "error", () => undefined);
});

afterEach(() => {
  mock.timers.reset();
  mock.restoreAll();
});

describe("geoService.geocode request shape", () => {
  test("calls Nominatim search with expected params and headers", async () => {
    mockFetch(async () => jsonResponse([hit()]));
    await geoService.geocode("Calle 5 # 10-20 & Cali");
    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, init] = call(0);
    const u = new URL(url);
    assert.equal(u.origin + u.pathname, "https://nominatim.openstreetmap.org/search");
    assert.equal(u.searchParams.get("format"), "json");
    assert.equal(u.searchParams.get("countrycodes"), "co");
    assert.equal(u.searchParams.get("limit"), "1");
    assert.equal(u.searchParams.get("q"), "Calle 5 # 10-20 & Cali");
    const headers = init.headers as Record<string, string>;
    assert.equal(headers["User-Agent"], "TrueK-App/1.0 (proyecto universitario)");
    assert.equal(headers["Accept-Language"], "es");
    assert.ok(init.signal instanceof AbortSignal);
  });

  test("maps lat/lon strings to numbers and keeps display_name", async () => {
    mockFetch(async () => jsonResponse([hit()]));
    const r = await geoService.geocode("cali");
    assert.deepEqual(r, { latitude: 3.4516, longitude: -76.532, display_name: "Cali, Valle" });
  });
});

describe("geoService.geocode errors", () => {
  const expect502 = async (): Promise<void> => {
    await assert.rejects(geoService.geocode("cali"), (e: BoomLike) => {
      assert.equal(e.isBoom, true);
      assert.equal(e.output.statusCode, 502);
      assert.equal(e.message, "No se pudo conectar con el servicio de geocodificación");
      return true;
    });
  };

  test("network error -> 502 without leaking the cause", async () => {
    mockFetch(async () => {
      throw new Error("ECONNREFUSED secret-detail");
    });
    await assert.rejects(geoService.geocode("cali"), (e: BoomLike) => {
      assert.equal(e.output.statusCode, 502);
      assert.ok(!e.message.includes("ECONNREFUSED"));
      assert.ok(!JSON.stringify(e.output.payload).includes("secret-detail"));
      return true;
    });
    assert.equal(consoleMock.mock.callCount(), 1);
  });

  test("AbortError -> 502", async () => {
    mockFetch(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect502();
  });

  test("TimeoutError -> 502", async () => {
    mockFetch(async () => {
      throw new DOMException("timeout", "TimeoutError");
    });
    await expect502();
  });

  test("non-2xx status -> 502", async () => {
    mockFetch(async () => jsonResponse([hit()], 503));
    await expect502();
  });

  test("invalid JSON body -> 502", async () => {
    mockFetch(async () => new Response("<html>", { status: 200 }));
    await expect502();
  });

  const invalidBodies: [string, unknown][] = [
    ["non-array body", {}],
    ["non-numeric lat", [hit({ lat: "abc" })]],
    ["lat out of range", [hit({ lat: "95" })]],
    ["lon out of range", [hit({ lon: "181" })]],
    ["missing display_name", [{ lat: "1", lon: "1" }]],
    ["non-string display_name", [hit({ display_name: 5 })]],
    ["null first item", [null]],
  ];
  for (const [name, body] of invalidBodies) {
    test(`${name} -> 502`, async () => {
      mockFetch(async () => jsonResponse(body));
      await expect502();
    });
  }

  test("empty array -> 404", async () => {
    mockFetch(async () => jsonResponse([]));
    await assert.rejects(geoService.geocode("nowhere"), (e: BoomLike) => {
      assert.equal(e.output.statusCode, 404);
      assert.equal(e.message, "No se encontró esa dirección");
      return true;
    });
  });
});

describe("geoService.geocode cache", () => {
  test("normalized key hits cache", async () => {
    mockFetch(async () => jsonResponse([hit()]));
    const a = await geoService.geocode("cali centro");
    const b = await geoService.geocode("  CALI   Centro ");
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.deepEqual(a, b);
  });

  test("404 results are not cached", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse([]));
    await assert.rejects(geoService.geocode("nada"));
    mock.timers.tick(1000);
    await assert.rejects(geoService.geocode("nada"));
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  test("502 results are not cached", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse({}, 500));
    await assert.rejects(geoService.geocode("falla"));
    mock.timers.tick(1000);
    await assert.rejects(geoService.geocode("falla"));
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  test("entry expires after 24h TTL", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse([hit()]));
    await geoService.geocode("cali");
    mock.timers.tick(24 * 60 * 60 * 1000 - 1);
    await geoService.geocode("cali");
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(1);
    await geoService.geocode("cali");
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  test("evicts the oldest entry beyond the max size", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse([hit()]));
    // Advancing 1s before each call keeps the throttle from sleeping.
    for (let i = 0; i <= GEOCODE_CACHE_MAX_ENTRIES; i++) {
      mock.timers.tick(1000);
      await geoService.geocode(`query ${i}`);
    }
    assert.equal(fetchMock.mock.callCount(), GEOCODE_CACHE_MAX_ENTRIES + 1);
    // Most recent is still cached.
    await geoService.geocode(`query ${GEOCODE_CACHE_MAX_ENTRIES}`);
    assert.equal(fetchMock.mock.callCount(), GEOCODE_CACHE_MAX_ENTRIES + 1);
    // Oldest was evicted.
    mock.timers.tick(1000);
    await geoService.geocode("query 0");
    assert.equal(fetchMock.mock.callCount(), GEOCODE_CACHE_MAX_ENTRIES + 2);
  });
});

describe("geoService.geocode throttle", () => {
  test("concurrent cache misses are spaced at least 1000ms", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse([hit()]));
    const p1 = geoService.geocode("uno");
    const p2 = geoService.geocode("dos");
    const p3 = geoService.geocode("tres");
    await flush();
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(999);
    await flush();
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(1);
    await flush();
    assert.equal(fetchMock.mock.callCount(), 2);
    mock.timers.tick(999);
    await flush();
    assert.equal(fetchMock.mock.callCount(), 2);
    mock.timers.tick(1);
    await Promise.all([p1, p2, p3]);
    assert.equal(fetchMock.mock.callCount(), 3);
  });

  test("a cache hit does not wait for the throttle", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
    mockFetch(async () => jsonResponse([hit()]));
    await geoService.geocode("cali");
    // Reserve a future slot with a different query.
    const pending = geoService.geocode("otra");
    await flush();
    // The cached call resolves without any timer tick.
    const r = await geoService.geocode("CALI");
    assert.equal(r.display_name, "Cali, Valle");
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.timers.tick(1000);
    await pending;
  });
});
