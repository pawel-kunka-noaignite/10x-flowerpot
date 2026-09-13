# F-01 Datastore: Implementation Plan

**Roadmap:** `context/foundation/roadmap.md` § F-01  
**Change ID:** f-01-datastore  
**Goal:** Plant CRUD on Azure Table Storage, per-user scoped via userId partition key  
**Success criteria:** `npm run build`, `npm run test`, `func start`, manual curl /api/plants → 200

---

## Overview

This plan delivers a minimal, working Plant datastore layer for Flowerpot:

1. **Setup Table Storage client** — `api/src/lib/tableClient.ts` — initialized connection to `AzureTable` via env `AzureWebJobsStorage` (local: `api/local.settings.json`)
2. **Define Table entity shape** — Plant domain type mapped to Table Storage (partition key = `userId`, row key = plant `id`; all other fields stored as JSON columns)
3. **Implement Plant repository** — `api/src/data/plantRepository.ts` — CRUD helpers (createPlant, getPlantsByUserId, updatePlant, deletePlant) with schema validation
4. **Add plants endpoint** — `api/src/functions/plants.ts` — HTTP function handling GET (list) and POST (create); follows health.ts pattern; routes to repo
5. **Wire auth** — Extract userId from `x-ms-client-principal` header, pass to repo; reject unauthenticated requests
6. **Test one helper** — `api/src/data/plantRepository.test.ts` — Vitest test on createPlant schema validation (MVP: one passing test to satisfy `/10x-impl-review` check #3)
7. **Verify build & dev-local startup** — `npm run build` passes tsc, `func start` runs without errors, curl returns 200

---

## Phases

### Phase 1: Setup (Groundwork)

**Goal:** Connect to Table Storage; establish patterns for schema and validation.

**Files created/modified:**

- **Create** `api/src/lib/tableClient.ts`
  - Initialize `TableClient` from `@azure/data-tables`
  - Read connection string from `process.env.AzureWebJobsStorage` (fallback to local.settings.json)
  - Export function `getTableClient(tableName: string): TableClient`
  - Document that `10xflowerpotdata` is the table name for all entities
  
- **Create** `api/src/data/plantRepository.ts`
  - Import type-only: `import type { Plant, CreatePlantDto, LightExposure } from "@10x-flowerpot/shared"`
  - Define runtime validation helper (schema shape check, required fields)
  - Implement skeleton: `createPlant`, `getPlantsByUserId`, `updatePlant`, `deletePlant` (all async)
  - Each function signature matches the DTO/Plant types
  - Use `userId` as partition key, plant `id` as row key

- **Modify** `api/package.json`
  - Add `@azure/data-tables` dependency (already present in Functions runtime, but ensure it is listed)

**Success:** Repo compiles, no ts errors.

---

### Phase 2: CRUD Implementation

**Goal:** Flesh out Plant repository with full Table Storage operations.

**Files created/modified:**

- **Edit** `api/src/data/plantRepository.ts`

  **createPlant(userId: string, dto: CreatePlantDto): Promise<Plant>**
  - Generate plant `id` (UUID or short random string)
  - Validate `dto`: presence of speciesId, nickname, lightExposure, lastWateredAt; validate lightExposure is one of "low"/"medium"/"bright"
  - Construct Plant entity: `{ id, ownerId: userId, speciesId, nickname, lightExposure, lastWateredAt }`
  - Call tableClient.createEntity() with partition key = userId, row key = id
  - Return Plant (or throw if validation fails)

  **getPlantsByUserId(userId: string): Promise<Plant[]>**
  - Query table with filter: `PartitionKey eq '${userId}'`
  - Map entities to Plant objects
  - Return array (empty if no plants)

  **updatePlant(userId: string, plantId: string, partial: Partial<Plant>): Promise<Plant>**
  - Fetch entity with partition key userId, row key plantId
  - Merge partial fields (preserve ownerId, id, speciesId if not in partial)
  - Call tableClient.updateEntity()
  - Return updated Plant (or throw if entity not found)

  **deletePlant(userId: string, plantId: string): Promise<void>**
  - Call tableClient.deleteEntity() with partition key userId, row key plantId
  - (Table Storage will silently succeed even if entity absent; that is acceptable for MVP)

  **Helper: validatePlantDto(dto: CreatePlantDto): void**
  - Check required fields: speciesId, nickname, lightExposure, lastWateredAt
  - Validate lightExposure ∈ {"low", "medium", "bright"}
  - Validate lastWateredAt is ISO date string (basic regex or Date.parse)
  - Throw `Error` with descriptive message if invalid

---

### Phase 3: HTTP Endpoint

**Goal:** Wire the repository into an HTTP function following health.ts pattern.

**Files created/modified:**

- **Create** `api/src/functions/plants.ts`
  - Import: `app`, `HttpRequest`, `HttpResponseInit`, `InvocationContext` from `@azure/functions`
  - Import type-only: `Plant, CreatePlantDto` from `@flowerpot/shared`
  - Import: `getUserId` from `../lib/auth`
  - Import: `{ createPlant, getPlantsByUserId, updatePlant, deletePlant }` from `../data/plantRepository`

  **Handler: async plants(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>**
  - Extract userId = getUserId(request)
  - If !userId, return 401 Unauthorized: `{ status: 401, jsonBody: { error: "Unauthenticated" } }`
  - Route by request.method:
    - **GET**: Call `getPlantsByUserId(userId)`, return 200 with array
    - **POST**: Parse request.json as CreatePlantDto, call `createPlant(userId, dto)`, return 201 with created Plant
    - Default: return 405 Method Not Allowed
  - Catch errors:
    - ValidationError / Error on dto: return 400 Bad Request with error message
    - Table Storage errors (e.g., entity not found on update): return 409/500 as appropriate (MVP: catch-all 500)
    - Log all errors via context.log()

  **Register:** `app.http('plants', { methods: ['GET', 'POST'], authLevel: 'anonymous', handler: plants })`
  - authLevel='anonymous' because auth is enforced in getUserId check (SWA header must be present)

---

### Phase 4: Testing

**Goal:** One passing unit test validating schema.

**Files created/modified:**

- **Create** `api/src/data/plantRepository.test.ts`
  - Import: `describe, it, expect` from `vitest`
  - Import type-only: `CreatePlantDto` from `@10x-flowerpot/shared`
  - Import: `{ createPlant }` from `./plantRepository` (or the validation helper directly if exported)

  **Test: createPlant with valid DTO**
  - Setup: mock or stub tableClient (or use in-memory mock)
  - Input: valid CreatePlantDto (speciesId, nickname, lightExposure, lastWateredAt)
  - Call createPlant("test-user-id", dto)
  - Assert: returned Plant has id, ownerId = "test-user-id", matches input fields
  - Assertion count: ≥ 3

  **Test: createPlant rejects invalid lightExposure**
  - Input: CreatePlantDto with lightExposure = "ultraviolet" (invalid)
  - Assert: throws Error
  - Assertion: error message contains "lightExposure"

  **MVP minimum:** At least one passing test. Suggested: combine both into one test file with 2 it() blocks.

**Note:** Full unit testing of the HTTP endpoint and database integration is deferred to later (post-MVP); this test focuses on validation logic, which is testable in isolation.

---

### Phase 5: Verification

**Goal:** Confirm build, test, and local dev-server startup succeed.

**Steps (manual):**

1. **Type-check:**
   ```bash
   npm run build
   ```
   - Should succeed without ts errors in both frontend/ and api/
   - Confirms: type-only imports are correct, shared types resolve, API compiles to CommonJS

2. **Unit test:**
   ```bash
   npm test
   ```
   - Should run Vitest suite and pass (at least the plantRepository.test.ts)
   - Confirms: test framework is wired, one test passes

3. **Local API startup:**
   ```bash
   npm run start --workspace @flowerpot/api
   ```
   - Should start Azure Functions local emulator on http://localhost:7071
   - Check logs for "Worker process started" and "Listening on 0.0.0.0:7071"
   - Function registration: "plants" and "health" should appear in startup logs

4. **Manual endpoint test (with stubbed user):**
   ```bash
   curl -H "x-ms-client-principal: eyJ1c2VySWQiOiJ0ZXN0LXVzZXIifQ==" http://localhost:7071/api/plants
   ```
   - (Header is base64 of `{"userId":"test-user"}`)
   - Expected: 200 OK
   - Body: `[]` (empty array, no plants yet) or `[{ stubbed plant }]` if seed data is added
   
   ```bash
   curl http://localhost:7071/api/plants
   ```
   - Without auth header
   - Expected: 401 Unauthorized

5. **Create a plant (manual POST):**
   ```bash
   curl -X POST \
     -H "x-ms-client-principal: eyJ1c2VySWQiOiJ0ZXN0LXVzZXIifQ==" \
     -H "Content-Type: application/json" \
     -d '{"speciesId":"monstera-deliciosa","nickname":"My Monstera","lightExposure":"bright","lastWateredAt":"2026-09-13"}' \
     http://localhost:7071/api/plants
   ```
   - Expected: 201 Created
   - Body: `{ id: "...", ownerId: "test-user", speciesId: "monstera-deliciosa", ... }`

---

## File Summary

### New files

| File | Purpose |
|------|---------|
| `api/src/lib/tableClient.ts` | Table Storage client initialization |
| `api/src/data/plantRepository.ts` | Plant CRUD business logic |
| `api/src/functions/plants.ts` | GET /api/plants, POST /api/plants HTTP handler |
| `api/src/data/plantRepository.test.ts` | Vitest unit tests for repository |

### Modified files

| File | Changes |
|------|---------|
| `api/package.json` | Ensure `@azure/data-tables` is listed (likely already present) |

---

## Design Decisions

### Partition key = userId

**Why:** Table Storage queries are efficient on partition key. By partitioning on userId, we:
- Enforce isolation: a query is scoped to one user's partition; no accidental cross-user leaks
- Enable horizontal scaling: users can be sharded across multiple table partitions
- Simplify access checks: no post-query filtering needed

### Row key = plant id

**Why:** Unique identifier per plant within a user's partition. Allows O(1) lookup: `getEntity(userId, plantId)`.

### Type-only imports from @flowerpot/shared

**Why:** `shared/` is not compiled to JS; the `api/` build (tsc + CommonJS) will fail if it tries to require a value import. Using `import type { ... }` erases the import at compile time, avoiding the runtime error. (See `context/foundation/lessons.md` for prior incident.)

### HTTP endpoint authLevel = 'anonymous'

**Why:** SWA's auth middleware runs before the function is invoked, but it does not enforce a 403 if the auth header is absent. We let the function receive the raw request, extract the header, and return 401 if missing. This allows us to:
- Distinguish between unauthenticated (missing header) and authenticated (header present) cleanly
- Use the same endpoint pattern for future public endpoints (health, species list) that don't require auth

### Validation in the repository layer, not the endpoint

**Why:** Validation is domain logic (shapes, constraints). Locating it in the repository makes it reusable if the endpoint is ever extended (e.g., batch create). The HTTP layer routes and translates HTTP semantics (401, 400, 201); the domain layer enforces invariants.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Table Storage connection fails locally** (e.g., wrong env var) | Startup error, hard to diagnose | Ensure `local.settings.json` has `AzureWebJobsStorage`; log connection string format on startup (not secret, just shape). |
| **Type-only import forgotten in endpoint** | Build fails in CI/deploy | Strict code review; lint rule (via tslint/ESLint) could flag non-type imports from `@10x-flowerpot/shared` (future). |
| **Plant id collisions** | Data corruption / overwrite | Use UUID v4 (e.g., `crypto.randomUUID()` in Node 15+) or short random string; collision probability is negligible for small MVP. |
| **No schema enforcement in Table Storage** | Invalid data in table | Repository validation is the only guard. (Acceptable for MVP; can add schema migration in future.) |
| **Cross-user query bug** | Data leak | Filter always on userId before returning; unit test should check this. Catch-all: code review. |

---

## Success Criteria (Automated + Manual)

### Automated

- [ ] `npm run build` exits 0 (no tsc errors in frontend/ or api/)
- [ ] `npm test` runs Vitest suite and all tests pass (at least plantRepository.test.ts)

### Manual

- [ ] `npm run start --workspace @flowerpot/api` starts without errors; functions "plants" and "health" register
- [ ] `curl -H "x-ms-client-principal: ..." http://localhost:7071/api/plants` returns 200 with `[]`
- [ ] `curl http://localhost:7071/api/plants` (no header) returns 401
- [ ] `curl -X POST -H "x-ms-client-principal: ..." -H "Content-Type: application/json" -d '{ valid dto }' http://localhost:7071/api/plants` returns 201 with a plant object

---

## Scope Boundaries

### In scope (this change)

- Plant CRUD on Table Storage (create, read, update, delete)
- Per-user scoping via userId partition key
- HTTP endpoint for GET list / POST create
- Basic validation (required fields, lightExposure enum)
- One unit test (schema validation)
- Startup verification

### Out of scope (deferred)

- CareTask CRUD (separate change, S-04+)
- Care schedule engine / business logic (S-02+)
- Frontend UI (separate change, S-02+)
- Comprehensive test coverage / E2E (post-MVP)
- Soft delete, audit trail, versioning
- Custom error codes or fault escalation policy

---

## Rollout Checklist

- [ ] All files created/modified per Phase 1-4
- [ ] `npm run build` passes
- [ ] `npm test` passes (at least plantRepository.test.ts)
- [ ] `func start` starts and registers plants + health functions
- [ ] Manual curl tests (GET, POST, 401) pass
- [ ] Code review via `/10x-impl-review` (checks plan adherence, pattern consistency, safety)
- [ ] Record any recurring lessons in `context/foundation/lessons.md` (if applicable)
- [ ] Archive this change with `/10x-archive` when merged

---

## Appendix: Environment Setup Reminder

### Local development (windows/WSL)

1. Ensure `api/local.settings.json` contains:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=10xflowerpotdata;..."
     }
   }
   ```
   (Connection string sourced from Azure Portal or verified by team lead.)

2. Install [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (`func` CLI).

3. Run:
   ```bash
   npm install
   npm run build
   npm run start --workspace @flowerpot/api
   ```

### CI/Deploy

- GitHub Actions workflow (`.github/workflows/deploy.yml`) builds all workspaces and deploys to Azure Static Web Apps.
- SWA injects connection string via App Settings at deploy time; functions do not need local.settings.json in production.
- (No manual action required in this change; documented for context.)

---

## References

- Roadmap: `context/foundation/roadmap.md` § F-01
- PRD: `context/foundation/prd.md` § Functional Requirements (FR-010 through FR-013)
- Shared types: `shared/index.ts` (Plant, CreatePlantDto, Species, LightExposure)
- Auth utility: `api/src/lib/auth.ts` (getUserId)
- Health endpoint example: `api/src/functions/health.ts`
- Test example: `api/src/data/speciesSeed.test.ts`
- Lessons: `context/foundation/lessons.md` (type-only imports, Azure Functions v4 deploy)
- Azure SDK: [@azure/data-tables](https://learn.microsoft.com/en-us/javascript/api/@azure/data-tables/)
- Azure Table Storage: [Concepts](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview)
