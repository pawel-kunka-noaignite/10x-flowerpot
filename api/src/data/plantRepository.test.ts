import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CreatePlantDto } from "@10x-flowerpot/shared";
import { validatePlantDto, createPlant } from "./plantRepository";

// Mock the tableClient module to avoid real Table Storage calls
vi.mock("../lib/tableClient", () => ({
  getTableClient: vi.fn(() => ({
    createEntity: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("plantRepository", () => {
  describe("validatePlantDto", () => {
    it("accepts a valid CreatePlantDto", () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "2026-09-13",
      };

      // Should not throw
      expect(() => validatePlantDto(dto)).not.toThrow();
    });

    it("rejects invalid lightExposure", () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "ultraviolet" as any, // Invalid value
        lastWateredAt: "2026-09-13",
      };

      expect(() => validatePlantDto(dto)).toThrow(/lightExposure/);
    });

    it("rejects missing speciesId", () => {
      const dto: CreatePlantDto = {
        speciesId: "",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "2026-09-13",
      };

      expect(() => validatePlantDto(dto)).toThrow(/speciesId/);
    });

    it("rejects missing nickname", () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "",
        lightExposure: "bright",
        lastWateredAt: "2026-09-13",
      };

      expect(() => validatePlantDto(dto)).toThrow(/nickname/);
    });

    it("rejects invalid lastWateredAt date", () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "not-a-date",
      };

      expect(() => validatePlantDto(dto)).toThrow(/lastWateredAt/);
    });

    it("accepts ISO 8601 date formats", () => {
      const validDates = [
        "2026-09-13",
        "2026-09-13T10:30:00Z",
        "2026-09-13T10:30:00.123Z",
      ];

      for (const date of validDates) {
        const dto: CreatePlantDto = {
          speciesId: "monstera-deliciosa",
          nickname: "My Monstera",
          lightExposure: "bright",
          lastWateredAt: date,
        };

        expect(() => validatePlantDto(dto)).not.toThrow();
      }
    });
  });

  describe("createPlant", () => {
    it("creates a plant with valid DTO and returns Plant with generated id", async () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "2026-09-13",
      };

      const plant = await createPlant("test-user-id", dto);

      expect(plant).toBeDefined();
      expect(plant.id).toBeDefined();
      expect(plant.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ); // UUID format
      expect(plant.ownerId).toBe("test-user-id");
      expect(plant.speciesId).toBe("monstera-deliciosa");
      expect(plant.nickname).toBe("My Monstera");
      expect(plant.lightExposure).toBe("bright");
      expect(plant.lastWateredAt).toBe("2026-09-13");
    });

    it("throws error if DTO validation fails", async () => {
      const dto: CreatePlantDto = {
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "ultraviolet" as any,
        lastWateredAt: "2026-09-13",
      };

      await expect(createPlant("test-user-id", dto)).rejects.toThrow(
        /lightExposure/
      );
    });
  });
});
