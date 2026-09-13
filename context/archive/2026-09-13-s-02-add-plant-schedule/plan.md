---
id: s-02-add-plant-schedule
title: Add Plant + Schedule
status: plan
created: 2026-09-13
prd_refs:
  - US-01
  - US-02
  - FR-010
  - FR-011
  - FR-020
  - FR-021
dependencies:
  - s-01-user-sign-in (completed)
success_criteria:
  - `npm run build` passes (full type-check across frontend, api, shared)
  - `npm run test` passes with ≥2 new tests (schedule engine + CareTask integration)
  - Manual: add-plant form renders on dashboard
  - Manual: fill form, submit → plant added, schedule computed and displayed
  - MVP-check criteria 2 (business logic computed) + 3 (tests pass) validated
---

# S-02: Add Plant + Schedule

## Vision

When a user adds their first plant to Flowerpot, they immediately see a computed care schedule with no extra configuration. The schedule adapts to the plant's species, the current season, and its light exposure. This story delivers the core business logic and UI to make that first-run experience seamless.

## Scope: In

**Schedule Engine**
- Pure function `computeSchedule(plant, speciesData, now): Map<CareAction, dueDate>`
- Lookup table: `(season, lightExposure) → intervalMultiplier` per `CareAction`
- Tests for edge cases: season boundaries, light variations, rounding

**CareTask Repository** (API data layer)
- `createCareTask(userId, plantId, action, dueDate): Promise<CareTask>`
- `getCareTasksByPlantId(userId, plantId): Promise<CareTask[]>`
- Separate table storage from plants (not embedded; userId partition key)

**POST /api/plants Enhancement**
- Existing: validates and stores Plant entity
- New: invoke schedule engine → create 3 CareTask records (water, fertilize, prune) immediately after plant is created
- Return plant + embedded initial tasks in response

**Add Plant Form** (Frontend)
- Form section on dashboard with fields: species (dropdown), nickname (text), light exposure (dropdown), lastWateredAt (date picker)
- Default lastWateredAt to today
- Call POST /api/plants on submit
- Show loading + success/error feedback

**Dashboard Plant List + Task Display** (Frontend)
- Render plant cards with:
  - Plant nickname and species
  - Embedded task preview: "Next watering: 3 days", "Next fertilizing: 7 days", etc.
  - Link to details (deferred; out of scope for MVP)
- Empty state message if no plants

## Scope: Out

- Edit plant
- Delete task
- Recurring task management (next-task recalculation after completion—deferred to S-03)
- Notification system
- Overdue task handling (deferred to S-03)

## Decisions (Confirmed)

1. **Schedule Engine Strategy:** Lookup table (season + light → interval multiplier)
2. **CareTask Storage:** Separate table (not embedded in Plant)
3. **Initial Schedule:** Water from `lastWateredAt`, others from `now` (current time)
4. **Frontend Form:** Dedicated form section on dashboard
5. **Dashboard Display:** Plant cards with embedded next-task preview

## Architecture & Data Flow

```
User submits add-plant form
  ↓
POST /api/plants(userId, CreatePlantDto)
  ↓
plantRepository.createPlant(userId, dto) → Plant entity stored
  ↓
computeSchedule(plant, speciesData, now) → Map<CareAction, dueDate>
  ↓
careTaskRepository.createCareTask(userId, plantId, action, dueDate) × 3
  ↓
API returns { plant, initialTasks[] }
  ↓
Frontend: store in state, re-render plant list + task preview
```

## Phases

### Phase 1: Schedule Engine + CareTask Repository (API)

**Files to create/edit:**

- `api/src/lib/scheduleEngine.ts` (new)
  - `computeSchedule(plant: Plant, species: Species, now: Date): Promise<Map<CareAction, Date>>`
  - Internal: `getSeason(date: Date): Season` — Northern hemisphere fixed calendar
  - Internal: `getIntervalMultiplier(season: Season, lightExposure: LightExposure, action: CareAction): number`
  - Lookup table data structure (inline or imported from seed)
  - **Test file:** `scheduleEngine.test.ts`
    - Test each season boundary (winter solstice, spring equinox, etc.)
    - Test each light exposure for one action (water)
    - Verify rounding (next task is always a whole day from now, not fractional)
    - Verify water uses `plant.lastWateredAt`, others use `now`

- `api/src/data/careTaskRepository.ts` (new)
  - `createCareTask(userId: string, plantId: string, action: CareAction, dueAt: Date): Promise<CareTask>`
  - `getCareTasksByPlantId(userId: string, plantId: string): Promise<CareTask[]>`
  - Use `getTableClient(TABLE_NAME)` with userId as partition key (standard pattern from plantRepository)
  - **Test file:** `careTaskRepository.test.ts`
    - Mock `getTableClient` (don't hit real storage)
    - Test create, fetch by plant, partition key enforcement (userId isolation)

**Decisions within Phase 1:**
- Table name: `"10xflowerpottasks"` (distinct from `"10xflowerpotdata"` for plants, allows independent scaling)
- Entity keys: `partitionKey = userId`, `rowKey = taskId` (matches plant pattern)
- dueAt stored as ISO string

---

### Phase 2: API Endpoint Enhancement

**Files to edit:**

- `api/src/functions/plants.ts`
  - Existing POST /api/plants stub → filled with full implementation
  - After `plantRepository.createPlant()`:
    - Call `computeSchedule(plant, speciesData, now)`
    - Loop through result and call `careTaskRepository.createCareTask()` for each action
    - Return `{ plant, initialTasks: CareTask[] }`
  - Error handling: if plant creation succeeds but task creation fails, consider rollback strategy (document as TODO for now; manual cleanup via Azure Portal)

- `shared/index.ts`
  - Add DTO: `interface PlantWithTasksResponse { plant: Plant; initialTasks: CareTask[] }`
  - Export it (used by frontend)

**Unit tests (implicit via scheduleEngine + careTaskRepository tests):**
- Integration test in `plants.test.ts`: mock repository calls, verify schedule engine is invoked with correct inputs

---

### Phase 3: Frontend Form + Dashboard Display

**Files to create/edit:**

- `frontend/src/components/AddPlantForm.tsx` (new)
  - React functional component
  - Fields:
    - species: select dropdown (pull from /api/species, already exists)
    - nickname: text input
    - lightExposure: select dropdown (hardcoded: "low", "medium", "bright")
    - lastWateredAt: date input (HTML5 date picker, default to `new Date().toISOString().split('T')[0]`)
  - On submit:
    - Call `POST /api/plants` with form data
    - Show loading spinner
    - On success: close form, trigger plant list refresh
    - On error: show error toast/message
  - **Test file:** `AddPlantForm.test.tsx`
    - Render form, verify fields
    - Simulate form submission, verify POST call
    - Verify success/error states (mocked fetch)

- `frontend/src/components/PlantCard.tsx` (new, or extend if Dashboard already has one)
  - Display:
    - Plant nickname (bold) + species common name
    - Embedded task preview: "Next watering: in 3 days" (compute days from dueAt to now)
    - Light exposure badge (visual indicator)
  - **Test file:** `PlantCard.test.tsx`
    - Render with sample plant + tasks
    - Verify task text is computed correctly

- `frontend/src/components/Dashboard.tsx` (edit)
  - Existing: probably empty or auth check only
  - New:
    - AddPlantForm section at top (or collapse/toggle)
    - Plant list: map over plants, render PlantCard for each
    - Empty state: "No plants yet. Add one to get started."
    - On mount: fetch plants from /api/plants (endpoint assumed to exist from S-01 or earlier)
    - Refetch after form submit (or use React query/SWR for cache invalidation)

- `frontend/src/App.tsx` (edit if needed)
  - Route to Dashboard (assumed already protected by ProtectedRoute from S-01)

**Test file:** `Dashboard.test.tsx`
- Render dashboard, verify empty state
- Mock API, render with 1 plant, verify card appears
- Verify add-plant form is present

---

### Phase 4: Build, Test, Verify

**Commands:**
```bash
# Type-check both frontend and api
npm run build

# Run all tests (frontend + api)
npm run test

# Manual verification
npm run dev
# → Open http://localhost:5173
# → Navigate to dashboard
# → Fill add-plant form, submit
# → Verify plant appears with tasks
```

**Success metrics:**
- `npm run build` exits 0 (no type errors)
- `npm run test` exits 0 with ≥2 new tests passing (scheduleEngine, careTaskRepository)
- Manual add-plant flow works end-to-end
- Plant card displays task previews correctly

---

## Implementation Order

1. **Phase 1a:** `scheduleEngine.ts` + tests (pure function, no dependencies)
2. **Phase 1b:** `careTaskRepository.ts` + tests (mock Table Storage, isolated)
3. **Phase 2a:** Enhance POST /api/plants to invoke schedule engine
4. **Phase 2b:** Add PlantWithTasksResponse DTO to shared/index.ts
5. **Phase 3a:** Build AddPlantForm component (form rendering + submission)
6. **Phase 3b:** Build PlantCard component (task preview rendering)
7. **Phase 3c:** Integrate Dashboard: form + plant list + empty state
8. **Phase 4:** Run build, test, manual validation

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Schedule engine season/light multiplier logic unclear | Lookup table is simple; tests will catch off-by-one errors. Document expected intervals for a known species (e.g., Monstera) in code comment. |
| CareTask table write fails after Plant is created | Document as known limitation for MVP. Manual cleanup via Azure Portal. Defer atomic transaction to S-04 (backlog). |
| Frontend form doesn't populate species dropdown | Endpoint `/api/species` must exist (check S-01 or prior changes). If missing, stub it with hardcoded species list for MVP. |
| Rounding: "in 3 days" becomes ambiguous near midnight | Compute dueAt - now in whole days (ceiling); always show minimum "in 1 day" even if due < 24h away. Document in component. |
| lastWateredAt date picker incompatible with Safari | HTML5 `<input type="date">` is widely supported; fallback to text input if needed. Out of scope for MVP. |

---

## Testing Strategy

**Unit Tests (Phase 1 & 2):**
- `scheduleEngine.test.ts`: 5–6 tests covering season detection, multiplier lookup, rounding
- `careTaskRepository.test.ts`: 4–5 tests covering create, fetch, partition key isolation

**Component Tests (Phase 3):**
- `AddPlantForm.test.tsx`: 3–4 tests (render, submit, success, error states)
- `PlantCard.test.tsx`: 2–3 tests (render with tasks, compute display text)
- `Dashboard.test.tsx`: 2–3 tests (empty state, plant list, form presence)

**Integration/Manual (Phase 4):**
- End-to-end form submission in dev mode
- Verify plant appears in list with task preview
- Verify `npm run build` type-checks across all packages

**Total:** ≥10 tests, ≥2 of which satisfy MVP-check criteria (business logic + integration).

---

## Shared Types (No Changes Required)

Existing `@flowerpot/shared` already defines:
- `Plant`, `CareAction`, `LightExposure`, `Season`, `Species`, `CareTask`, `CreatePlantDto`

New DTO for Phase 2:
- `PlantWithTasksResponse = { plant: Plant; initialTasks: CareTask[] }`

**Import discipline:** In `api/`, use `import type { ... }` only (per lessons.md). Runtime values (e.g., schedule computation) must live in `api/src/lib/`, not imported from `shared/`.

---

## Success Validation

**Build & Type-Check:**
```bash
npm run build
# Expected: exit 0, no TS errors
```

**Tests:**
```bash
npm run test
# Expected: exit 0, ≥2 passing tests (schedule engine + careTask repo)
```

**Manual (Local Dev):**
1. `npm run dev` → frontend loads at http://localhost:5173
2. Dashboard renders with empty state
3. Add plant form appears
4. Fill form (e.g., Monstera, "My Monstera", bright, today)
5. Submit → success message or plant appears in list
6. Plant card shows: nickname, species, next watering date
7. No console errors

**MVP-Check Alignment:**
- Criterion 2 (business logic): Schedule engine computes intervals correctly ✓
- Criterion 3 (tests): ≥2 new tests pass ✓

---

## Follow-Up (Not in Scope)

- **S-03:** Task completion → recalculate next occurrence (reschedule logic)
- **S-04:** Atomic transactions (plant + initial tasks) or rollback strategy
- **S-05:** Overdue task handling, visual indicators
- **Future:** Edit plant, delete task, recurring task management, notifications
