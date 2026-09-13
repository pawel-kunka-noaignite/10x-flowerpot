# Test Plan

> Central registry of risks the test suite addresses. Shapes test coverage strategy and enables `/10x-impl-review` to verify that tests map to stated risks.

## Test Risks & Coverage

### Risk 1: Schedule Engine Miscalculates Intervals for Edge Cases

**Problem**: The schedule engine computes care task due dates based on plant species, season, and light exposure. Miscalculations could lead to:
- Plants watered too often (root rot) or too rarely (dead plants)
- Fertilizer intervals off by weeks (stunt growth or toxicity)
- Prune dates missed, causing overgrowth or disease

**Edge cases that must not break the calculation**:
1. Season boundary dates (e.g., last day of winter → first day of spring)
2. Light exposure modifiers at extremes (very low vs. very bright)
3. Species with minimal base intervals (succulents, ~14 days) vs. frequent (ferns, ~3 days)
4. Leap year handling (February 29 existence in year calculations)
5. Past watering dates (lastWateredAt in the past)
6. Intervals rounding up (fractional days → ceiling to next whole day)

**Test coverage**:
- **Automated**: `api/src/lib/scheduleEngine.test.ts` — 21 unit tests covering all edge cases above
- **Location**: `api/src/lib/scheduleEngine.test.ts` lines 1–300+
- **Test examples**:
  - `test("winter to spring boundary")` — ensures March 21 is treated as spring
  - `test("bright light with short interval")` — succulents stay on schedule even when light is high
  - `test("intervals round up to next day")` — 7.2 days → 8 days, never 7
  - `test("past lastWateredAt computes correctly")` — watering date 30 days ago doesn't produce negative intervals

**Success criterion**: All 21 tests pass. If any test fails, the risk is active; if all pass, the risk is mitigated for the tested edge cases.

---

### Risk 2: Task Creation Fails Silently, User Never Sees Tasks

**Problem**: When a user adds a plant, the API creates a Plant record and then creates 3 CareTask records (water, fertilize, prune). If task creation fails but plant creation succeeds:
- User sees plant in their list (success appears partial)
- User has no tasks to guide care (user confusion, plant dies)
- Data consistency broken (orphaned tasks or empty schedules)

**Mitigation**:
- Wrap task creation in try-catch; log failures but continue gracefully
- Return plant + initialTasks response with actual created tasks (not assumed)
- Frontend displays "Schedule computed" message only if tasks were created

**Test coverage**:
- **Automated**: `api/src/data/careTaskRepository.test.ts` — 12 tests, including:
  - `test("createCareTask persists to table storage")` — verifies task actually lands in DB
  - `test("getCareTasksByPlantId returns only tasks for that plant")` — isolation check
  - `test("handles table write failure gracefully")` — mocked failure scenario
- **Location**: `api/src/data/careTaskRepository.test.ts`

**Success criterion**: All 12 tests pass. Manual verification: add a plant in the deployed SWA instance and confirm tasks appear in response.

---

### Risk 3: User Isolation Violated (User A sees User B's Plants)

**Problem**: Per-user scoping via `userId` partition key is the cornerstone of security. If queries don't filter by partition key:
- Multi-tenant data leak
- GDPR/privacy violation
- Security incident

**Mitigation**:
- All repository methods enforce partition key in queries
- CareTaskRepository filters by `userId` partition key explicitly
- Plant and CareTask repositories tested with multiple users

**Test coverage**:
- **Automated**: Integration tests in both repositories verify per-user filtering
  - `test("getPlantsByUserId returns only this user's plants")`
  - `test("getCareTasksByUserId filters by partition key")`
- **Location**: `api/src/data/plantRepository.test.ts` (line ~80) and `api/src/data/careTaskRepository.test.ts` (line ~100)

**Success criterion**: All isolation tests pass. Code review confirms no unfiltered queries.

---

## Test Execution

Run all tests with:

```bash
npm test
```

Expected result: **77 tests passing** (47 API + 30 frontend).

For schedule engine only:

```bash
npm test --workspace @10x-flowerpot/api -- scheduleEngine
```

---

## Risk Acceptance

| Risk | Mitigation Status | Defer/Accept |
|------|-------------------|--------------|
| Schedule miscalculation | 21 tests, edge cases covered | ✅ Mitigated |
| Task creation failure | 12 tests + manual verification | ✅ Mitigated |
| User isolation violation | Repository-level filtering + tests | ✅ Mitigated |

All risks are **mitigated** for MVP. No open risks accepted.
