// Shared domain types for Flowerpot, imported by both `frontend` and `api`.
// Type-only — erased at compile time, so no runtime dependency is created.

export type CareAction = "water" | "fertilize" | "prune";

export type LightExposure = "low" | "medium" | "bright";

export type Season = "spring" | "summer" | "autumn" | "winter";

/** A curated reference species with base care intervals (days). */
export interface Species {
  id: string;
  commonName: string;
  /** Base interval in days per care action, before season/light adjustment. */
  baseIntervals: Record<CareAction, number>;
}

/** A plant owned by a user. */
export interface Plant {
  id: string;
  ownerId: string;
  speciesId: string;
  nickname: string;
  lightExposure: LightExposure;
  lastWateredAt: string; // ISO date
}

/** A scheduled care task for a plant. */
export interface CareTask {
  id: string;
  plantId: string;
  action: CareAction;
  dueAt: string; // ISO date
  completedAt: string | null;
}

// --- DTOs (transport shapes across the frontend/api boundary) ---

export interface CreatePlantDto {
  speciesId: string;
  nickname: string;
  lightExposure: LightExposure;
  lastWateredAt: string;
}

export type UpdatePlantDto = Partial<Omit<CreatePlantDto, never>>;

export interface HealthResponse {
  status: "ok";
  service: string;
}
