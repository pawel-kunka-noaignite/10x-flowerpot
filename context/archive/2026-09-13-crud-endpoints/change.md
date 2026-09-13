# Change: CRUD Endpoints (Update + Delete)

**Change ID**: crud-endpoints  
**Date opened**: 2026-09-13  
**Status**: in-progress  
**Blocker**: None (F-01 + F-02 completed)

## Problem

The `plants.ts` HTTP function currently only exposes GET (read) and POST (create) methods.
- `updatePlant()` function exists in `plantRepository.ts` but is NOT exposed as PUT endpoint
- `deletePlant()` function exists but is NOT exposed as DELETE endpoint
- MVP requires all 4 CRUD operations for certification

## Solution

1. Add PUT `/api/plants/:id` endpoint to handle partial updates (nickname, lightExposure, lastWateredAt)
2. Add DELETE `/api/plants/:id` endpoint to handle plant removal
3. Add unit tests for both new endpoints (per-user isolation, validation, 404 handling)
4. Verify all 4 CRUD operations work end-to-end

## Scope (MUST for cert)

- ✅ PUT endpoint in `api/src/functions/plants.ts`
- ✅ DELETE endpoint in `api/src/functions/plants.ts`
- ✅ Unit tests in `api/src/functions/plants.test.ts` (5-6 tests)
- ✅ Build + test suite passes
- ✅ Commit

## Out of Scope (NICE-TO-HAVE)

- Frontend UI for update/delete (→ M3 S-01)
- Integration tests with live Table Storage
- E2E tests via SWA
- API versioning

## Acceptance Criteria

- [ ] npm run build → zero errors
- [ ] npm test (API) → all tests pass
- [ ] PUT /api/plants/:id updates plant and returns 200 + updated entity
- [ ] DELETE /api/plants/:id removes plant and returns 204
- [ ] Both endpoints require authentication (401 if no userId)
- [ ] Both endpoints enforce per-user isolation (404 if plant belongs to another user)
