---
id: s-02-add-plant-schedule
title: Add Plant + Schedule
status: implemented
created: 2026-09-13
completed_phases:
  - Phase 1a: Schedule Engine (✓)
  - Phase 1b: CareTask Repository (✓)
  - Phase 2: API Enhancement (✓)
prd_refs:
  - US-01
  - US-02
  - FR-010
  - FR-011
  - FR-020
  - FR-021
---

# S-02: Add Plant + Schedule

## Phases Completed

### Phase 1a: Schedule Engine ✓
- `api/src/lib/scheduleEngine.ts` — Pure function `computeSchedule(plant, species, now)`
- Lookup table: season × light exposure → interval multiplier
- `getSeason()` — Northern hemisphere calendar boundaries
- 21 tests covering season detection, multiplier lookups, and rounding

### Phase 1b: CareTask Repository ✓
- `api/src/data/careTaskRepository.ts` — CRUD operations with Table Storage
- `createCareTask(userId, plantId, action, dueAt): Promise<CareTask>`
- `getCareTasksByPlantId(userId, plantId): Promise<CareTask[]>`
- `getCareTasksByUserId(userId): Promise<CareTask[]>`
- 12 tests covering entity creation, partition key isolation, and filtering

### Phase 2: API Enhancement ✓
- Enhanced POST /api/plants to invoke schedule engine and create tasks
- Added `PlantWithTasksResponse` DTO to shared types
- Added `getSpeciesById()` helper to speciesSeed.ts
- Returns `{ plant, initialTasks: CareTask[] }`

## Validation Results

✅ **Build**: `npm run build` passes (no type errors)
✅ **Tests**: `npm run test` passes (47 tests, including 33 new tests for phases 1–2)
✅ **Commits**: 3 focused commits created
  - `c863ee2` Add schedule engine with season and light multipliers
  - `b124402` Add CareTask repository with Table Storage integration
  - `e38bdcd` Enhance POST /api/plants to create initial care schedule

## Known Limitations

- **Phase 3** (Frontend Form + Dashboard) deferred — not in scope for this implementation
- **Error handling**: If task creation fails after plant is created, manual cleanup needed (documented as TODO in plan)

## Next Steps

- Phase 3: Frontend form, plant list UI, task display (out of scope for this change)
- Integration testing with real Azure Table Storage
- Manual verification of end-to-end flow
