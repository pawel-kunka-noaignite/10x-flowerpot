import type { Plant, Species, CareAction, Season, LightExposure } from "@10x-flowerpot/shared";

/**
 * Determines the current season based on a given date (Northern hemisphere).
 * Winter: Dec 21 – Mar 20
 * Spring: Mar 21 – Jun 20
 * Summer: Jun 21 – Sep 22
 * Autumn: Sep 23 – Dec 20
 *
 * @param date - The date to determine season for
 * @returns The season name
 */
export function getSeason(date: Date): Season {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const day = date.getDate();

  // Spring: Mar 21 – Jun 20 (month 2-5)
  if (month === 2 && day >= 21) return "spring";
  if (month === 3 || month === 4) return "spring";
  if (month === 5 && day <= 20) return "spring";

  // Summer: Jun 21 – Sep 22 (month 5-8)
  if (month === 5 && day >= 21) return "summer";
  if (month === 6 || month === 7) return "summer";
  if (month === 8 && day <= 22) return "summer";

  // Autumn: Sep 23 – Dec 20 (month 8-11)
  if (month === 8 && day >= 23) return "autumn";
  if (month === 9 || month === 10) return "autumn";
  if (month === 11 && day <= 20) return "autumn";

  // Winter: Dec 21 – Mar 20 (month 11 or 0-2)
  return "winter";
}

/**
 * Lookup table: multipliers by (season, lightExposure) for each CareAction.
 * Base interval × multiplier = adjusted interval in days.
 * Higher multiplier = longer interval (plant needs less frequent care).
 * Lower multiplier = shorter interval (plant needs more frequent care).
 */
type IntervalLookup = Record<
  Season,
  Record<LightExposure, Record<CareAction, number>>
>;

const INTERVAL_MULTIPLIERS: IntervalLookup = {
  spring: {
    low: { water: 1.2, fertilize: 1.0, prune: 0.9 },
    medium: { water: 1.0, fertilize: 0.9, prune: 0.8 },
    bright: { water: 0.8, fertilize: 0.8, prune: 0.7 },
  },
  summer: {
    low: { water: 0.9, fertilize: 0.9, prune: 0.9 },
    medium: { water: 0.7, fertilize: 0.8, prune: 0.8 },
    bright: { water: 0.6, fertilize: 0.7, prune: 0.7 },
  },
  autumn: {
    low: { water: 1.3, fertilize: 1.1, prune: 1.0 },
    medium: { water: 1.1, fertilize: 1.0, prune: 0.9 },
    bright: { water: 0.9, fertilize: 0.9, prune: 0.8 },
  },
  winter: {
    low: { water: 1.5, fertilize: 1.3, prune: 1.1 },
    medium: { water: 1.3, fertilize: 1.2, prune: 1.0 },
    bright: { water: 1.1, fertilize: 1.0, prune: 0.9 },
  },
};

/**
 * Looks up the interval multiplier for a given season, light exposure, and care action.
 *
 * @param season - Current season
 * @param lightExposure - Plant's light exposure level
 * @param action - Type of care action (water, fertilize, prune)
 * @returns Multiplier to apply to base interval
 */
export function getIntervalMultiplier(
  season: Season,
  lightExposure: LightExposure,
  action: CareAction
): number {
  return INTERVAL_MULTIPLIERS[season][lightExposure][action];
}

/**
 * Represents a computed due date for a care task.
 */
export interface TaskSchedule {
  action: CareAction;
  dueAt: Date;
}

/**
 * Computes the initial care schedule for a plant based on its species,
 * current season, light exposure, and last watered date.
 *
 * - Water task: due date computed from plant.lastWateredAt + (baseInterval × multiplier)
 * - Fertilize & Prune tasks: due date computed from now + (baseInterval × multiplier)
 *
 * @param plant - The plant entity
 * @param species - The species reference data (includes base intervals)
 * @param now - Current timestamp (allows for deterministic testing)
 * @returns Array of scheduled tasks (water, fertilize, prune)
 */
export function computeSchedule(
  plant: Plant,
  species: Species,
  now: Date
): TaskSchedule[] {
  const season = getSeason(now);
  const baseIntervals = species.baseIntervals;

  // Compute due dates for each care action
  const tasks: TaskSchedule[] = [];

  // Water: compute from lastWateredAt
  const waterMultiplier = getIntervalMultiplier(season, plant.lightExposure, "water");
  const waterIntervalDays = Math.ceil(baseIntervals.water * waterMultiplier);
  const lastWateredDate = new Date(plant.lastWateredAt);
  const waterDueDate = new Date(lastWateredDate);
  waterDueDate.setDate(waterDueDate.getDate() + waterIntervalDays);
  tasks.push({ action: "water", dueAt: waterDueDate });

  // Fertilize: compute from now
  const fertilizeMultiplier = getIntervalMultiplier(season, plant.lightExposure, "fertilize");
  const fertilizeIntervalDays = Math.ceil(baseIntervals.fertilize * fertilizeMultiplier);
  const fertilizeDueDate = new Date(now);
  fertilizeDueDate.setDate(fertilizeDueDate.getDate() + fertilizeIntervalDays);
  tasks.push({ action: "fertilize", dueAt: fertilizeDueDate });

  // Prune: compute from now
  const pruneMultiplier = getIntervalMultiplier(season, plant.lightExposure, "prune");
  const pruneIntervalDays = Math.ceil(baseIntervals.prune * pruneMultiplier);
  const pruneDueDate = new Date(now);
  pruneDueDate.setDate(pruneDueDate.getDate() + pruneIntervalDays);
  tasks.push({ action: "prune", dueAt: pruneDueDate });

  return tasks;
}
