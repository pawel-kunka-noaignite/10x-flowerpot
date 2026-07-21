---
skill: 10x-bootstrapper
mode: chain
phase_1_status: passed
phase_2_status: passed
phase_3_status: ok
starter_id: vite-react
path_taken: custom
project_name: flowerpot
date: 2026-07-22
---

# Bootstrap verification — Flowerpot

> Custom-path bootstrap. The `vite-react` starter card covers only the frontend.
> Per `tech-stack.md`, the project is a unified-TypeScript SPA + Azure Functions API
> in one repo, so the scaffold was assembled from official CLIs by hand:
> `npm create vite` (frontend) + `func init`/`func new` (api) + a local shared
> types package. `bootstrapper_confidence: first-class` (not `verified`) reflects
> exactly this manual backend step.

## Hand-off

Consumed verbatim from `context/foundation/tech-stack.md`:

```yaml
starter_id: vite-react
package_manager: npm
project_name: flowerpot
hints:
  language_family: js
  team_size: solo
  deployment_target: azure-static-web-apps
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: custom
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

**Why this stack (summary):** solo web MVP, end-to-end TypeScript so one toolchain
and shared domain types span the app. Frontend = Vite + React + TS SPA (PWA-ready);
backend = Azure Functions Node v4 (TS); deploy target = Azure Static Web Apps
(static SPA + integrated Functions API + built-in auth); CI = GitHub Actions.

## Pre-scaffold verification

Light recency check (read-only, WARN-AND-CONTINUE). Findings:

| Signal | Package / repo | Version | Severity |
| --- | --- | --- | --- |
| Frontend scaffolder | `create-vite` | 9.1.1 | fresh |
| Backend runtime | `@azure/functions` (Node v4 model) | 4.16.2 | fresh |
| Toolchain | Node.js | v24.12.0 | fresh |
| Toolchain | Azure Functions Core Tools (`func`) | 4.12.1 | fresh |

No stale signals. Proceeded to scaffold.

## Scaffold log

Custom cwd strategy (manual, official-CLI delegation — no `.bootstrap-scaffold`
temp dir needed because each CLI targets its own subdirectory).

Resolved invocations, all exit code 0:

1. `npm create vite@latest frontend -- --template react-ts` → `frontend/` (React 19 + TS).
2. `func init api --worker-runtime node --language typescript --model V4` → `api/` (Azure Functions Node v4).
3. `func new --template "HTTP trigger" --name health` → `api/src/functions/health.ts`.
4. Hand-authored `shared/` package `@flowerpot/shared` (domain types: `Species`, `Plant`, `CareTask`, `CareAction`, DTOs).
5. Root `package.json` wired as npm workspaces `["shared", "frontend", "api"]`.
6. `npm install` from root — 0 vulnerabilities, workspace symlinks created.

**Conflict policy:** `context/` preserved verbatim (untouched). `.gitignore`
append-merged: existing course block (`.agents`, `.ai`, `.course`) kept, workspace
`node_modules`/`dist` + Azure Functions local settings appended. No `.scaffold`
siblings were produced (no clashes). Existing `AGENTS.md` left as-is.

**Shared-types proof:**
- `frontend/src/lib/careLabel.ts` imports `CareAction` from `@flowerpot/shared`.
- `api/src/functions/health.ts` returns a typed `HealthResponse` from `@flowerpot/shared`.

**Verification of a working skeleton:**
- `npm run test --workspace @flowerpot/frontend` → Vitest: 1 file, 1 test **passed**.
- `npm run build --workspace @flowerpot/frontend` → `tsc -b && vite build` **passed**.
- `npm run build --workspace @flowerpot/api` → `tsc` **passed**.

## Post-scaffold audit

`audit_command` for `language_family: js` → `npm audit`.

- Result: **found 0 vulnerabilities** (127 packages audited).
- CRITICAL: 0 · HIGH: 0 · MODERATE: 0 · LOW: 0.

No action required.

## Hints recorded but not acted on

Surfaced from the hand-off, deferred by design (v1 bootstrap does not act on them):

- `deployment_target: azure-static-web-apps` — IaC (Bicep/Terraform) + deploy wiring deferred to **M1L5**.
- `ci_provider: github-actions`, `ci_default_flow: auto-deploy-on-merge` — CI workflow deferred to **M1L5**.
- `has_auth: true` — per-user access control implemented later (M2/M3 feature work + SWA built-in auth).
- `AGENTS.md` / `CLAUDE.md` agent context — deferred to **M1L4** (memory architecture).
- Tailwind, shadcn/ui, TanStack — UI wiring deferred to feature work in **M2** (not needed for skeleton + passing test).

## Next steps

Project is scaffolded and verified — happy hacking. Next chain link: **M1L4**
(agent context: filtered `AGENTS.md`), then **M1L5** (`infrastructure.md`,
`deploy-plan.md`, first deploy to Azure Static Web Apps).
