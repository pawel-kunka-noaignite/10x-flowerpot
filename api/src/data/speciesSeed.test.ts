import { describe, it, expect } from "vitest";
import { SPECIES_SEED } from "./speciesSeed";

describe("SPECIES_SEED", () => {
  it("has between 15 and 20 curated species", () => {
    expect(SPECIES_SEED.length).toBeGreaterThanOrEqual(15);
    expect(SPECIES_SEED.length).toBeLessThanOrEqual(20);
  });

  it("has unique ids", () => {
    const ids = SPECIES_SEED.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a positive integer base interval for every care action", () => {
    for (const species of SPECIES_SEED) {
      for (const action of ["water", "fertilize", "prune"] as const) {
        const days = species.baseIntervals[action];
        expect(Number.isInteger(days)).toBe(true);
        expect(days).toBeGreaterThan(0);
      }
    }
  });
});
