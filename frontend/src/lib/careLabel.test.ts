import { describe, it, expect } from "vitest";
import { careActionLabel } from "./careLabel";

describe("careActionLabel", () => {
  it("maps every care action to a label", () => {
    expect(careActionLabel("water")).toBe("Water");
    expect(careActionLabel("fertilize")).toBe("Fertilize");
    expect(careActionLabel("prune")).toBe("Prune");
  });
});
