import type { Species } from "@10x-flowerpot/shared";

/**
 * Curated reference dataset of common houseplant species with base care
 * intervals (days), before season/light adjustment. Read-only, no per-user
 * data — safe to keep as a static in-memory constant.
 */
export const SPECIES_SEED: Species[] = [
  { id: "monstera-deliciosa", commonName: "Monstera", baseIntervals: { water: 7, fertilize: 30, prune: 90 } },
  { id: "sansevieria-trifasciata", commonName: "Wężownica (sansewieria)", baseIntervals: { water: 21, fertilize: 60, prune: 180 } },
  { id: "epipremnum-aureum", commonName: "Złocień (pothos)", baseIntervals: { water: 9, fertilize: 30, prune: 60 } },
  { id: "ficus-elastica", commonName: "Fikus sprężysty", baseIntervals: { water: 10, fertilize: 30, prune: 90 } },
  { id: "ficus-lyrata", commonName: "Figowiec lirowaty", baseIntervals: { water: 10, fertilize: 30, prune: 90 } },
  { id: "spathiphyllum", commonName: "Skrzydłokwiat", baseIntervals: { water: 7, fertilize: 30, prune: 60 } },
  { id: "chlorophytum-comosum", commonName: "Zielistka (chlorofytum)", baseIntervals: { water: 8, fertilize: 30, prune: 60 } },
  { id: "zamioculcas-zamiifolia", commonName: "Zamiokulkas", baseIntervals: { water: 18, fertilize: 45, prune: 120 } },
  { id: "aloe-vera", commonName: "Aloes zwyczajny", baseIntervals: { water: 18, fertilize: 60, prune: 180 } },
  { id: "crassula-ovata", commonName: "Grubosz jajowaty (drzewko szczęścia)", baseIntervals: { water: 16, fertilize: 45, prune: 120 } },
  { id: "dracaena-marginata", commonName: "Dracena obrzeżona", baseIntervals: { water: 10, fertilize: 30, prune: 90 } },
  { id: "philodendron-hederaceum", commonName: "Filodendron serduszkowaty", baseIntervals: { water: 8, fertilize: 30, prune: 60 } },
  { id: "calathea-orbifolia", commonName: "Kalatea Orbifolia", baseIntervals: { water: 6, fertilize: 30, prune: 60 } },
  { id: "phalaenopsis", commonName: "Storczyk (phalaenopsis)", baseIntervals: { water: 8, fertilize: 21, prune: 30 } },
  { id: "hedera-helix", commonName: "Bluszcz pospolity", baseIntervals: { water: 7, fertilize: 30, prune: 45 } },
  { id: "peperomia-obtusifolia", commonName: "Pieperomia matowa", baseIntervals: { water: 10, fertilize: 30, prune: 60 } },
  { id: "aglaonema", commonName: "Aglaonema", baseIntervals: { water: 9, fertilize: 30, prune: 90 } },
  { id: "ctenanthe", commonName: "Ctenanthe", baseIntervals: { water: 6, fertilize: 30, prune: 60 } },
  { id: "schefflera-arboricola", commonName: "Szeflera", baseIntervals: { water: 8, fertilize: 30, prune: 90 } },
  { id: "yucca-elephantipes", commonName: "Yucca (juka)", baseIntervals: { water: 14, fertilize: 45, prune: 120 } },
];
