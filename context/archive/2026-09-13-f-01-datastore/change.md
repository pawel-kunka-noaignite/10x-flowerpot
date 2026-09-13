---
change_id: f-01-datastore
created: 2026-09-13
status: archived
archived_at: 2026-09-13T11:06:05Z
updated: 2026-09-13
---

# F-01: Datastore Implementation

**ID:** f-01-datastore  
**Roadmap ref:** `context/foundation/roadmap.md` § F-01  
**Status:** implemented  
**Owner:** (you)

## Summary

Implement Plant CRUD with Azure Table Storage persistence, scoped per user via partition key (`userId`). Foundation for all downstream slices (S-02, S-03, S-04).

### Acceptance Criteria

- `npm run build` passes (tsc type-checks both workspaces)
- `npm run test` passes (Vitest suite, at least one datastore unit test)
- `func start` runs locally without errors (API function cold-start on Port 7071)
- Manual curl to `http://localhost:7071/api/plants` returns 200 with empty array (or stubbed data for the logged-in user)

---

## Context

- **Scope in:** Plant CRUD (create, read list, update, delete) with Table Storage persistence; one unit test on schema validation
- **Scope out:** CareTask CRUD, care schedule engine, frontend UI, comprehensive test coverage, E2E
- **Tech stack locked:** Azure Functions Node v4 (TS), Azure Table Storage (`10xflowerpotdata`), Vitest
- **Auth pattern:** userId extracted from SWA header via `api/src/lib/auth.ts#getUserId()`
- **Precedent:** `api/src/functions/health.ts` (endpoint shape), `api/src/lib/auth.ts` (header parsing), `api/src/data/speciesSeed.test.ts` (test pattern)
- **Lessons:** Type-only imports from `@flowerpot/shared` in API (avoid breaking CommonJS build)

---

See `plan.md` for detailed phases, file changes, and success criteria.
