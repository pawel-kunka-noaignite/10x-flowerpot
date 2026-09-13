# Implementation Plan: CRUD Endpoints

## Overview

Expose Update (PUT) and Delete (DELETE) HTTP endpoints for plants, backed by existing `updatePlant()` and `deletePlant()` repository functions.

## Architecture

```
PUT /api/plants
  ├─ Body: { plantId, nickname?, lightExposure?, lastWateredAt? }
  ├─ Auth: Extract userId from header (fail 401 if absent)
  ├─ Query: plantRepository.updatePlant(userId, plantId, partial)
  ├─ Response: 200 { plant }
  └─ Error: 404 if plant not found (per-user isolation) | 400 if validation fails

DELETE /api/plants
  ├─ Query: ?id=<plantId>
  ├─ Auth: Extract userId from header (fail 401 if absent)
  ├─ Query: plantRepository.deletePlant(userId, plantId)
  ├─ Response: 204 No Content
  └─ Error: 404 if plant not found | 401 unauthenticated
```

## Implementation Steps

### Step 1: Extend `plants.ts` HTTP function

1. Add `request.method === "PUT"` case:
   - Extract `userId` (auth)
   - Parse body as `{ plantId: string, ...partial: Partial<Plant> }`
   - Call `updatePlant(userId, plantId, partial)`
   - Return 200 + updated entity or 404/400

2. Add `request.method === "DELETE"` case:
   - Extract `userId` (auth)
   - Get `plantId` from query string (`?id=<plantId>`)
   - Call `deletePlant(userId, plantId)` 
   - Return 204 or 404/401

3. Update route registration:
   ```typescript
   app.http('plants', {
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     authLevel: 'anonymous',
     handler: plants,
   });
   ```

### Step 2: Add unit tests in `api/src/functions/plants.test.ts`

Create new test file with:

1. **PUT tests** (3):
   - Happy path: update nickname, verify 200 + updated plant returned
   - Unauthenticated: no userId header, expect 401
   - Not found: wrong plantId, expect 404 (per-user isolation)

2. **DELETE tests** (2):
   - Happy path: delete plant, verify 204
   - Not found: wrong plantId, expect 404

3. **Shared** (1):
   - Unauthenticated DELETE: expect 401

### Step 3: Verify & commit

- `npm run build` → zero errors
- `npm test --workspace @10x-flowerpot/api` → all pass
- 5 small commits (one per logical chunk)

## Risk Mitigation

- **User isolation**: `updatePlant()` and `deletePlant()` both take userId as param; tests verify 404 when plant belongs to other user
- **Validation**: existing `validatePlantDto()` + TypeScript catch invalid payloads; test with bad JSON
- **Atomicity**: Table Storage operations are atomic per entity; no partial-update risk

## Success Criteria

- All 4 CRUD operations now available via HTTP
- Per-user isolation enforced (tested)
- Authentication required (tested)
- All tests pass
