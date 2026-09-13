# Auth via Azure Static Web Apps built-in auth — Implementation Plan

## Overview

Wire up Azure Static Web Apps' built-in authentication so the deployed app can
identify a logged-in user without introducing a new Azure resource, tenant, or
MSAL client code. This is the foundation slice (F-02) that S-01 (visible sign-in
gate) and every later per-user data slice (S-02+) depend on.

## Current State Analysis

- No `staticwebapp.config.json` exists anywhere in the repo — SWA currently serves
  the SPA and API with no route rules and no auth requirement.
- `api/src/functions/health.ts` and `api/src/functions/species.ts` are both
  `authLevel: 'anonymous'` Azure Functions — that authLevel is a Functions-runtime
  concept, unrelated to SWA's own auth/role proxy layer in front of `/api/*`.
- No code anywhere reads `x-ms-client-principal`.
- `shared/index.ts` already has `Plant.ownerId: string`, the field future slices
  will populate from the authenticated user's id.

## Desired End State

- `frontend/public/staticwebapp.config.json` (copied verbatim into `frontend/dist`
  by Vite's build, matching how `app_location: frontend/dist` is deployed) defines
  SWA route rules: `/api/health` and `/api/species` stay `anonymous`; every other
  `/api/*` route requires the built-in `authenticated` role.
- `api/src/lib/auth.ts` exports `getUserId(request): string | null`, which decodes
  the base64-JSON `x-ms-client-principal` header SWA injects into authenticated
  requests and returns the principal's `userId` (or `null` if absent/malformed).
- A unit test (`api/src/lib/auth.test.ts`) proves the decode works against a known
  fixture header and returns `null` when the header is missing.
- Verify: `npm run build` (root) and `npm run test --workspace @10x-flowerpot/api`
  are green.

### Key Discoveries:

- SWA's route-level `allowedRoles` enforcement happens independently of a
  Function's own `authLevel`; both `anonymous` Function endpoints stay reachable
  only because they're explicitly listed with `"allowedRoles": ["anonymous"]` in
  `staticwebapp.config.json` — every other `/api/*` route falls through to the
  `authenticated` rule and SWA blocks unauthenticated calls before they reach the
  Function at all.
- `x-ms-client-principal` is only present on requests SWA has itself authenticated
  and proxied through; it cannot be forged by an external caller hitting the SWA
  domain directly (SWA strips/overwrites it), so trusting the header inside
  `getUserId` is safe for this deployment model.

## What We're NOT Doing

- Not building the frontend login/logout UI or a route guard — that's S-01.
- Not calling `/.auth/me` from the frontend yet — also S-01.
- Not configuring a specific identity provider (GitHub/AAD/etc.) — SWA's default
  providers work out of the box; picking/branding one is a S-01/UX concern, not a
  foundation blocker.
- Not protecting `/api/species` or `/api/health` — they're reference/status data,
  no user-scoping needed.

## Implementation Approach

Two small, independent changes: a static SWA config file (infra-as-config, no
code) and a tiny API-side helper function with a unit test. No datastore
dependency — this only prepares the mechanism F-01/S-02 will consume.

## Phase 1: SWA route config + principal-parsing helper

### Overview

Single phase — both pieces are small and have no dependency on each other beyond
both being required for "F-02 done".

### Changes Required:

#### 1. SWA route rules

**File**: `frontend/public/staticwebapp.config.json`

**Intent**: Keep reference endpoints public, require the built-in `authenticated`
role for every other API route.

**Contract**:
```json
{
  "routes": [
    { "route": "/api/health", "allowedRoles": ["anonymous"] },
    { "route": "/api/species", "allowedRoles": ["anonymous"] },
    { "route": "/api/*", "allowedRoles": ["authenticated"] }
  ],
  "responseOverrides": {
    "401": { "redirect": "/.auth/login/aad", "statusCode": 302 }
  }
}
```

#### 2. Principal-parsing helper

**File**: `api/src/lib/auth.ts`

**Intent**: Single place every future domain endpoint calls to get the acting
user's id.

**Contract**: `export function getUserId(request: HttpRequest): string | null` —
reads the `x-ms-client-principal` header, base64-decodes it, JSON-parses it, and
returns `.userId`; returns `null` on missing header or any parse failure (never
throws).

#### 3. Unit test

**File**: `api/src/lib/auth.test.ts`

**Intent**: Regression guard for the decode logic — the actual "risk" being
mitigated is silently returning the wrong/no user id and letting a request through
unscoped.

**Contract**: One test builds a fixture request with a valid base64-encoded
principal (`{ userId: "abc123", ... }`) and asserts `getUserId` returns
`"abc123"`; a second test asserts `getUserId` returns `null` when the header is
absent.

### Success Criteria:

#### Automated Verification:

- [ ] API build passes: `npm run build --workspace @10x-flowerpot/api`
- [ ] API tests pass: `npm run test --workspace @10x-flowerpot/api`
- [ ] Root build passes: `npm run build`

#### Manual Verification:

- [ ] `frontend/dist/staticwebapp.config.json` exists after `npm run build`
      (confirms Vite copies the `public/` file verbatim)

---

## Testing Strategy

### Unit Tests:

- `getUserId` decode success + missing-header fallback in `api/src/lib/auth.test.ts`.

### Manual Testing Steps:

1. `npm run build` at repo root; confirm `frontend/dist/staticwebapp.config.json`
   is present.
2. (Post-deploy, out of scope for this change) hit `/api/species` anonymously and
   confirm it still works; hit a hypothetical protected route while logged out and
   confirm a 401/redirect — deferred until a protected domain route exists (S-02).

## References

- Reference endpoint pattern: `api/src/functions/health.ts`
- Roadmap item: `context/foundation/roadmap.md` F-02
- SWA config docs concept: `routes` + `allowedRoles` + `responseOverrides`
  (built-in `anonymous`/`authenticated` roles, no custom role config needed for MVP)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step
> lands.

### Phase 1: SWA route config + principal-parsing helper

#### Automated

- [x] 1.1 API build passes
- [x] 1.2 API tests pass — oracle-verified: temporarily made `getUserId` always
      return `null`, confirmed the happy-path test failed, then reverted.
- [x] 1.3 Root build passes

#### Manual

- [x] 1.4 `frontend/dist/staticwebapp.config.json` present after build
