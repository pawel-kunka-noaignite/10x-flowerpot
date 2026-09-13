# Auth via SWA built-in auth — Plan Brief

> Full plan: `context/changes/auth-swa/plan.md`

## What & Why

Wire up Azure Static Web Apps' built-in authentication (route rules +
`x-ms-client-principal` parsing) so future domain endpoints can identify and
scope data to a logged-in user. No new Azure resource, tenant, or MSAL client
code — a deliberate simplification for certification speed (see roadmap F-02
pivot, 2026-09-13).

## Starting Point

No `staticwebapp.config.json` and no principal-parsing code exist anywhere in
the repo; both API endpoints so far (`health`, `species`) are intentionally
public.

## Desired End State

`frontend/public/staticwebapp.config.json` protects every `/api/*` route except
`health` and `species`; `api/src/lib/auth.ts#getUserId` reliably extracts the
user id from SWA's injected header, with a unit test covering both the happy
path and the missing-header case.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Auth mechanism | SWA built-in auth (route rules + header) | Zero new Azure resources/tenant vs. Entra External ID + MSAL (roadmap pivot) |
| Where route rules live | `frontend/public/staticwebapp.config.json` | Vite copies `public/` verbatim into `frontend/dist`, which is the deployed `app_location` |
| Where principal parsing lives | `api/src/lib/auth.ts`, one helper | Single reusable place every future domain endpoint calls, instead of re-parsing per function |

## Scope

**In scope:** SWA route config, `getUserId` helper + unit test.

**Out of scope:** frontend login/logout UI, route guard, `/.auth/me` fetch
(all S-01); picking/branding a specific identity provider.

## Architecture / Approach

Config-only route protection at the SWA edge + a tiny, dependency-free helper
function on the API side. No datastore dependency.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. SWA route config + principal helper | `staticwebapp.config.json`, `getUserId`, unit test | Low — config + pure function, no runtime auth to exercise until deploy |

**Prerequisites:** none (F-02 has no blockers).
**Estimated effort:** single session, single phase.

## Open Risks & Assumptions

- Full end-to-end verification of the 401 redirect and header injection can only
  happen post-deploy against live SWA — deferred until S-02 adds a protected
  domain route to exercise it against.

## Success Criteria (Summary)

- `staticwebapp.config.json` ships inside `frontend/dist` after build.
- `getUserId` unit tests pass and would fail if the decode logic broke (verified
  by deliberately breaking it once).
