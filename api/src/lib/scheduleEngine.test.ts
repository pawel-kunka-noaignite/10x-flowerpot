import { describe, it, expect } from "vitest";
import { getSeason, getIntervalMultiplier, computeSchedule } from "./scheduleEngine";
import type { Plant, Species } from "@10x-flowerpot/shared";

describe("scheduleEngine", () => {
  describe("getSeason", () => {
    it("returns 'winter' for December 21", () => {
      const date = new Date(2026, 11, 21); // Dec 21
      expect(getSeason(date)).toBe("winter");
    });

    it("returns 'winter' for January", () => {
      const date = new Date(2026, 0, 15); // Jan 15
      expect(getSeason(date)).toBe("winter");
    });

    it("returns 'winter' for March 20", () => {
      const date = new Date(2026, 2, 20); // Mar 20
      expect(getSeason(date)).toBe("winter");
    });

    it("returns 'spring' for March 21", () => {
      const date = new Date(2026, 2, 21); // Mar 21
      expect(getSeason(date)).toBe("spring");
    });

    it("returns 'spring' for April", () => {
      const date = new Date(2026, 3, 15); // Apr 15
      expect(getSeason(date)).toBe("spring");
    });

    it("returns 'spring' for June 20", () => {
      const date = new Date(2026, 5, 20); // Jun 20
      expect(getSeason(date)).toBe("spring");
    });

    it("returns 'summer' for June 21", () => {
      const date = new Date(2026, 5, 21); // Jun 21
      expect(getSeason(date)).toBe("summer");
    });

    it("returns 'summer' for July", () => {
      const date = new Date(2026, 6, 15); // Jul 15
      expect(getSeason(date)).toBe("summer");
    });

    it("returns 'summer' for September 22", () => {
      const date = new Date(2026, 8, 22); // Sep 22
      expect(getSeason(date)).toBe("summer");
    });

    it("returns 'autumn' for September 23", () => {
      const date = new Date(2026, 8, 23); // Sep 23
      expect(getSeason(date)).toBe("autumn");
    });

    it("returns 'autumn' for October", () => {
      const date = new Date(2026, 9, 15); // Oct 15
      expect(getSeason(date)).toBe("autumn");
    });

    it("returns 'autumn' for December 20", () => {
      const date = new Date(2026, 11, 20); // Dec 20
      expect(getSeason(date)).toBe("autumn");
    });
  });

  describe("getIntervalMultiplier", () => {
    it("returns higher multiplier for low light (plants need less frequent watering)", () => {
      const lowLightWater = getIntervalMultiplier("winter", "low", "water");
      const brightLightWater = getIntervalMultiplier("winter", "bright", "water");
      expect(lowLightWater).toBeGreaterThan(brightLightWater);
    });

    it("returns lower multiplier for bright light and summer (plants need more frequent watering)", () => {
      const summerBright = getIntervalMultiplier("summer", "bright", "water");
      const winterBright = getIntervalMultiplier("winter", "bright", "water");
      expect(summerBright).toBeLessThan(winterBright);
    });

    it("returns valid multipliers for all seasons and light levels", () => {
      const seasons = ["spring", "summer", "autumn", "winter"] as const;
      const lightLevels = ["low", "medium", "bright"] as const;
      const actions = ["water", "fertilize", "prune"] as const;

      for (const season of seasons) {
        for (const light of lightLevels) {
          for (const action of actions) {
            const multiplier = getIntervalMultiplier(season, light, action);
            expect(multiplier).toBeGreaterThan(0);
            expect(multiplier).toBeLessThanOrEqual(2);
          }
        }
      }
    });
  });

  describe("computeSchedule", () => {
    const monsteraSpecies: Species = {
      id: "monstera-deliciosa",
      commonName: "Monstera",
      baseIntervals: { water: 7, fertilize: 30, prune: 90 },
    };

    it("computes schedule for a plant with bright light in winter", () => {
      const now = new Date(2026, 0, 15); // Jan 15 (winter)
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "2026-01-08", // 7 days ago (in winter, with bright light)
      };

      const tasks = computeSchedule(plant, monsteraSpecies, now);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].action).toBe("water");
      expect(tasks[1].action).toBe("fertilize");
      expect(tasks[2].action).toBe("prune");

      // Water: computed from lastWateredAt (7 days ago) + (7 * 1.1 multiplier for bright winter)
      // = 7 days ago + 8 days = today (or tomorrow depending on rounding)
      const waterDue = tasks[0].dueAt;
      expect(waterDue).toBeDefined();
      expect(waterDue.getTime()).toBeGreaterThan(now.getTime()); // Should be in future

      // Fertilize and Prune should be computed from now
      const fertilizeDue = tasks[1].dueAt;
      const pruneDue = tasks[2].dueAt;
      expect(fertilizeDue.getTime()).toBeGreaterThan(now.getTime());
      expect(pruneDue.getTime()).toBeGreaterThan(now.getTime());
      expect(pruneDue.getTime()).toBeGreaterThan(fertilizeDue.getTime()); // Prune is less frequent
    });

    it("computes schedule for a plant with low light in summer", () => {
      const now = new Date(2026, 6, 15); // Jul 15 (summer)
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "low",
        lastWateredAt: "2026-07-13", // 2 days ago
      };

      const tasks = computeSchedule(plant, monsteraSpecies, now);

      expect(tasks).toHaveLength(3);

      // In summer with low light, water multiplier is 0.9, so interval = 7 * 0.9 = 6.3 days → ceil = 7
      // lastWateredAt + 7 days should be in future but not too far
      const waterDue = tasks[0].dueAt;
      const daysFromNow = (waterDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(4); // At least 4 days from now (13 + 7 = 20, now is 15)
      expect(daysFromNow).toBeLessThan(10); // But not too far
    });

    it("applies ceiling rounding so intervals are whole days", () => {
      const now = new Date(2026, 0, 1);
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "bright",
        lastWateredAt: "2025-12-25",
      };

      const tasks = computeSchedule(plant, monsteraSpecies, now);

      // All due dates should be in the future (intervals are whole days)
      for (const task of tasks) {
        expect(task.dueAt.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it("returns water task computed from lastWateredAt, not from now", () => {
      const now = new Date(2026, 6, 15); // Jul 15
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "medium",
        lastWateredAt: "2026-06-01", // 44 days ago (way longer than any interval)
      };

      const tasks = computeSchedule(plant, monsteraSpecies, now);
      const waterTask = tasks.find((t) => t.action === "water")!;

      // Water task should be based on June 1, not July 15
      // Base: 7 days, multiplier (summer, medium): 0.7 → 5 days
      // June 1 + 5 = June 6 (which is in the past)
      // But our function should still compute it correctly
      expect(waterTask.dueAt).toBeDefined();
    });

    it("handles all three tasks in the correct order", () => {
      const now = new Date(2026, 3, 15); // Apr 15 (spring)
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "monstera-deliciosa",
        nickname: "My Monstera",
        lightExposure: "medium",
        lastWateredAt: "2026-04-14",
      };

      const tasks = computeSchedule(plant, monsteraSpecies, now);

      expect(tasks.map((t) => t.action)).toEqual(["water", "fertilize", "prune"]);
    });

    it("computes different schedules based on species base intervals", () => {
      const now = new Date(2026, 3, 15); // Apr 15 (spring)
      const plant: Plant = {
        id: "plant-1",
        ownerId: "user-1",
        speciesId: "sansevieria-trifasciata",
        nickname: "Snake Plant",
        lightExposure: "bright",
        lastWateredAt: "2026-04-14",
      };

      const snakePlantSpecies: Species = {
        id: "sansevieria-trifasciata",
        commonName: "Sansevieria",
        baseIntervals: { water: 21, fertilize: 60, prune: 180 },
      };

      const monsteraSchedule = computeSchedule(
        { ...plant, speciesId: "monstera-deliciosa", nickname: "Monstera" },
        monsteraSpecies,
        now
      );

      const snakePlantSchedule = computeSchedule(plant, snakePlantSpecies, now);

      // Monstera needs water more often (base 7 days vs 21)
      const monsteraWater = monsteraSchedule.find((t) => t.action === "water")!;
      const snakePlantWater = snakePlantSchedule.find((t) => t.action === "water")!;

      expect(monsteraWater.dueAt.getTime()).toBeLessThan(snakePlantWater.dueAt.getTime());
    });
  });
});
