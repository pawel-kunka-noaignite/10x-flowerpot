# Species Seed Implementation Plan

## Overview

Add a curated, static reference dataset of ~20 common houseplant species with base
care intervals (watering/fertilizing/pruning, in days), and expose it to the frontend
through a read-only API endpoint. This unblocks S-02 (add-plant-schedule), which needs
a species to look up base intervals for the schedule engine.

## Current State Analysis

- `shared/index.ts` already defines the `Species` interface (`id`, `commonName`,
  `baseIntervals: Record<CareAction, number>`) but no data.
- `shared/` ships raw `.ts`, never compiled — per `context/foundation/lessons.md`,
  a **value** import from `@10x-flowerpot/shared` breaks the `api/` `tsc` build. Only
  `import type` is safe across that boundary.
- `api/src/functions/health.ts` is the only existing endpoint — reference pattern for
  a new Azure Functions v4 HTTP function.
- `api/package.json` has `"test": "echo \"No tests yet...\""` — no test runner wired
  up in the API workspace yet.

## Desired End State

- `api/src/data/speciesSeed.ts` exports `SPECIES_SEED: Species[]` with 20 entries,
  unique ids, positive intervals for all three care actions.
- `GET /api/species` (anonymous, like `health`) returns the seed as JSON.
- Vitest is wired up in `api/` (`npm run test --workspace @10x-flowerpot/api`) and one
  test file asserts the dataset invariants (count in range, unique ids, positive
  intervals) — this is also the first regression guard against a malformed seed.
- Verify: `curl` the endpoint locally via `func start`, and `npm test` (api workspace)
  is green.

### Key Discoveries:

- Species data is reference/read-only — it does not need per-user isolation or a
  datastore, so it can be a plain in-memory constant server-side (`api/src/data/`),
  consistent with the "type-only across the shared boundary" rule.
- The frontend does not need its own copy of the data; it consumes `/api/species`
  like any other API resource, avoiding duplication between two runtimes.

## What We're NOT Doing

- Not adding a `shared/` build step (compiled JS + d.ts) to allow runtime value
  imports there — out of scope for a single static dataset; revisit only if more
  runtime logic needs to be shared verbatim between `frontend` and `api`.
- Not building the frontend species picker UI yet — that belongs to S-02.
- Not adding FR-031 (custom species with manual intervals) — parked in the roadmap.

## Implementation Approach

Keep the dataset inside `api/` (the only runtime that needs it for the schedule
engine later), expose it over HTTP the same way `health` is exposed, and add a
lightweight Vitest setup in `api/` so the dataset has a real regression test now and
the schedule engine (S-02) has a place to land its own unit tests later.

## Phase 1: Species dataset, endpoint, and test

### Overview

Single phase — this is a small, self-contained foundation slice with no UI and no
datastore.

### Changes Required:

#### 1. Species dataset

**File**: `api/src/data/speciesSeed.ts`

**Intent**: Static array of ~20 curated houseplant species with base care intervals,
matching the `Species` shape from `@10x-flowerpot/shared` (imported `type`-only).

**Contract**: `export const SPECIES_SEED: Species[]` — 20 entries, kebab-case `id`,
Polish `commonName`, `baseIntervals` with positive integer days for `water`,
`fertilize`, `prune`.

#### 2. Species HTTP endpoint

**File**: `api/src/functions/species.ts`

**Intent**: Expose the seed read-only over HTTP, mirroring `health.ts`'s registration
pattern.

**Contract**: `app.http('species', { methods: ['GET'], authLevel: 'anonymous', handler
})` returning `{ jsonBody: SPECIES_SEED }`.

#### 3. Test runner wiring

**File**: `api/package.json`, `api/vitest.config.ts` (new)

**Intent**: Add Vitest as a dev dependency and a `test` script so API-side unit tests
can run, replacing the placeholder `echo` script.

**Contract**: `"test": "vitest run"`; config restricts to `src/**/*.test.ts`.

#### 4. Dataset invariants test

**File**: `api/src/data/speciesSeed.test.ts`

**Intent**: Guard against a malformed seed (wrong count, duplicate ids, non-positive
intervals) — the regression test for this change.

**Contract**: Asserts `SPECIES_SEED.length` is between 15 and 20, all `id`s unique,
and every `baseIntervals` value is a positive integer for all three care actions.

### Success Criteria:

#### Automated Verification:

- [ ] API build passes: `npm run build --workspace @10x-flowerpot/api`
- [ ] API tests pass: `npm run test --workspace @10x-flowerpot/api`
- [ ] Root build passes: `npm run build`

#### Manual Verification:

- [ ] `func start` in `api/` and `curl http://localhost:7071/api/species` returns 20
      species as JSON

**Implementation Note**: After automated verification passes, pause for manual
confirmation (local `func start` + curl) before marking this change done.

---

## Testing Strategy

### Unit Tests:

- Dataset invariants (count, uniqueness, positive intervals) in
  `api/src/data/speciesSeed.test.ts`.

### Manual Testing Steps:

1. `npm run build` at repo root.
2. `func start` inside `api/`.
3. `curl http://localhost:7071/api/species` and confirm 20 species with the expected
   shape.

## References

- Reference endpoint pattern: `api/src/functions/health.ts`
- Boundary rule: `context/foundation/lessons.md` ("Import @flowerpot/shared as types
  only across the API boundary")
- Roadmap item: `context/foundation/roadmap.md` F-03

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step
> lands.

### Phase 1: Species dataset, endpoint, and test

#### Automated

- [x] 1.1 API build passes
- [x] 1.2 API tests pass
- [x] 1.3 Root build passes

#### Manual

- [x] 1.4 `func start` + curl `/api/species` returns 20 species
