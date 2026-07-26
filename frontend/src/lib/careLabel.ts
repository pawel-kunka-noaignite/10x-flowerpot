import type { CareAction } from "@10x-flowerpot/shared";

/** Human-readable label for a care action, used across the UI. */
export function careActionLabel(action: CareAction): string {
  switch (action) {
    case "water":
      return "Water";
    case "fertilize":
      return "Fertilize";
    case "prune":
      return "Prune";
  }
}
