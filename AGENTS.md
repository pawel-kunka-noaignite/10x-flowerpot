# Repository Guidelines

Flowerpot — houseplant care scheduling (web/PWA). End-to-end TypeScript in an npm-workspaces monorepo.

## Hard rules (read first)

- Domain types live once in `shared/` (package `@flowerpot/shared`) and are imported by both `frontend/` and `api/`. Never redefine `Plant`, `CareTask`, `Species`, or the DTOs anywhere else.
- Import shared types type-only: `import type { X } from "@flowerpot/shared"`. The `api/` build (`tsc`, CommonJS) does not compile `shared/`, so a **value** import from it breaks the API build. Types only across that boundary. See `@context/foundation/lessons.md`.
- Read `@context/foundation/prd.md` before implementing a feature — it is the source of truth for scope (FR-/US- IDs) and the care-scheduling business rule. Do not invent features outside it.
- Never write to `context/archive/` (immutable).

## Project structure

- npm-workspaces monorepo: `frontend/` (Vite + React + TS SPA, PWA target) · `api/` (Azure Functions, Node v4 model, TS) · `shared/` (`@flowerpot/shared` domain types + DTOs).
- API functions: one HTTP function per file in `api/src/functions/`, registered via `app.http(...)`. Reference shape: `@api/src/functions/health.ts`.
- Small pure helpers go in `frontend/src/lib/` with a co-located `*.test.ts`. Reference shape: `@frontend/src/lib/careLabel.ts`.
- Spec/context: `context/foundation/` (PRD, tech-stack, lessons) and `context/changes/` (per-change work).

## Commands (run from repo root)

- `npm test` — frontend Vitest suite.
- `npm run build` — builds `frontend` then `api`; use it to type-check both workspaces.
- `npm run dev` — frontend dev server.
- API locally: `npm run start --workspace @flowerpot/api` (requires Azure Functions Core Tools `func`).

## Conventions

- Tests are Vitest, co-located as `<name>.test.ts` next to the unit under test.
- Commit subjects: imperative mood, capitalized, ≤ 50 chars, no trailing period.
- `api/local.settings.json` is gitignored — never commit secrets there.

---

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 2, Lesson 1

Move from sprint-zero setup to project orchestration with the **roadmap chain**:

```
(Module 1 foundation docs) -> /10x-roadmap -> backlog-ready roadmap items
```

`/10x-roadmap` is the lesson focus. `/10x-new` is intentionally introduced in Module 2, Lesson 2, when a selected roadmap item becomes an implementation change folder.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Roadmap (lesson focus)** | |
| `/10x-roadmap` | You have `context/foundation/prd.md` and a scaffolded project baseline, and you need a vertical-first MVP roadmap. The skill reads the PRD, inspects the code baseline, uses available foundation docs such as `tech-stack.md`, `infrastructure.md`, and `deploy-plan.md`, then writes `context/foundation/roadmap.md`. Use it BEFORE creating per-change folders or implementation plans. |
| **Re-run upstream if needed** | |
| `/10x-shape` / `/10x-prd` / `/10x-tech-stack-selector` / `/10x-bootstrapper` / `/10x-agents-md` / `/10x-infra-research` | Bundled from Module 1 so foundation contracts can be fixed before roadmap sequencing. If roadmap generation exposes a PRD gap, repair the PRD before pretending the backlog is ready. |

### How the chain hands off

- `/10x-roadmap` bridges product and implementation. It does not choose frameworks, design schemas, or write a per-change implementation plan.
- The output is `context/foundation/roadmap.md`: ordered milestones, vertical slices, bounded foundations, dependencies, unknowns, risk, and backlog handoff fields.
- Roadmap items should receive stable human-readable identifiers in backlog tools. The actual `context/changes/<change-id>/` folder is created in Lesson 2 with `/10x-new`.

### Roadmap boundaries

- Default to vertical slices: user-visible outcomes that cross UI, data, business logic, and integrations.
- Horizontal work is allowed only as a bounded enabler that names the downstream vertical milestone it unlocks.
- Avoid orphan horizontal work such as "build the whole database", "build all API endpoints", or "design the whole UI" before the first user-visible flow.
- Roadmap is not a calendar estimate. Do not invent dates, story points, or sprint velocity unless the user explicitly asks for a separate planning artifact.

### Foundation paths used by this lesson

- `context/foundation/prd.md` - input
- `context/foundation/tech-stack.md` - optional input
- `context/foundation/infrastructure.md` - optional input
- `context/deployment/deploy-plan.md` - optional input
- `context/foundation/roadmap.md` - output
- `context/foundation/lessons.md` - recurring rules and pitfalls
- `docs/reference/contract-surfaces.md` - load-bearing names registry

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
