import { describe, expect, it } from "vitest";
import { haversineKm, NEARBY_RADIUS_KM, REQUERY_DISTANCE_KM } from "@/lib/geo";

describe("haversineKm", () => {
  it("returns 0 for the same point", () => {
    const p = { latitude: 3.4516, longitude: -76.532 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("returns about 3.73 km for a known pair in Cali", () => {
    const d = haversineKm(
      { latitude: 3.4516, longitude: -76.532 },
      { latitude: 3.4208327, longitude: -76.5453099 },
    );
    expect(d).toBeGreaterThan(3.68);
    expect(d).toBeLessThan(3.78);
  });

  it("exposes the expected constants", () => {
    expect([NEARBY_RADIUS_KM, REQUERY_DISTANCE_KM]).toEqual([6, 0.3]);
  });
});
