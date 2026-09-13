# Species Seed — Plan Brief

> Full plan: `context/changes/species-seed/plan.md`

## What & Why

Add a curated, static dataset of ~20 common houseplant species with base care
intervals (watering/fertilizing/pruning, in days), exposed read-only via the API.
This is the reference data the schedule engine (S-02) needs to compute a plant's
care schedule from its species.

## Starting Point

`shared/index.ts` already defines the `Species` shape; no data and no endpoint exist
yet. `api/` has no test runner wired up.

## Desired End State

`GET /api/species` returns 20 species as JSON; a Vitest suite in `api/` guards the
dataset against malformed entries (wrong count, duplicate ids, non-positive
intervals).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Where the data lives | `api/src/data/speciesSeed.ts` (not `shared/`) | `shared/` is never compiled, so a value import from it would break the `api/` `tsc` build (see `lessons.md`) |
| How the frontend gets it | Via `GET /api/species`, not a duplicated copy | Avoids keeping two datasets in sync across runtimes |
| Test runner | Add Vitest to `api/` now | Needed anyway for the schedule engine's unit tests in S-02/M3 |

## Scope

**In scope:** dataset, HTTP endpoint, Vitest setup in `api/`, dataset invariants test.

**Out of scope:** frontend species picker UI (S-02), custom species (parked FR-031),
a `shared/` build step for runtime value exports.

## Architecture / Approach

Static array lives server-side next to the schedule engine that will consume it;
exposed over HTTP the same way `health.ts` is, so the frontend fetches it like any
other resource.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Species dataset, endpoint, test | `SPECIES_SEED`, `/api/species`, Vitest in `api/`, invariants test | Low — no datastore, no auth dependency |

**Prerequisites:** none (F-03 has no blockers).
**Estimated effort:** single session, single phase.

## Open Risks & Assumptions

- Interval values are reasonable defaults, not horticulturally verified — acceptable
  for MVP; can be tuned later without touching the schema.

## Success Criteria (Summary)

- `/api/species` returns 20 well-formed species.
- `npm run test --workspace @10x-flowerpot/api` is green and would fail if the seed
  were broken (verified by deliberately breaking it once).
