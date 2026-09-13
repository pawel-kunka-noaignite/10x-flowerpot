<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Species Seed Implementation Plan

- **Plan**: context/changes/species-seed/plan.md
- **Scope**: Phase 1 of 1
- **Date**: 2026-09-13
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — tsconfig exclude for vitest.config.ts not named in the plan contract

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: api/tsconfig.json
- **Detail**: The plan's Phase 1 contract for "Test runner wiring" named `api/package.json`
  and `api/vitest.config.ts` but not the `tsconfig.json` exclude list. Adding
  `vitest.config.ts` (and `**/*.test.ts`) to `exclude` was necessary because `tsc`
  otherwise tries to type-check `vitest`'s own nested Vite types (subpath `#types/...`
  imports it can't resolve under this project's `moduleResolution`), which breaks
  `npm run build --workspace @10x-flowerpot/api`. Discovered during automated
  verification, not pre-planned.
- **Fix**: None needed — the change is correct and necessary; documenting it here is
  sufficient since it is a one-line, narrowly-scoped addition with no behavioral
  side effect on the compiled output.
- **Decision**: SKIPPED — accepted as a normal plan-adherence footnote; no code change
  required. (Documented per M2L3 "min. 1 udokumentowany skip".)

### F2 — Residual moderate `npm audit` finding in `@vitest/mocker`

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: api/package.json (transitive: vitest → @vitest/mocker)
- **Detail**: `npm audit fix` resolved 4 of 5 vulnerabilities surfaced by adding
  `vitest`. One moderate advisory remains (GHSA-82fw-gwwq-j7x9, path traversal /
  arbitrary file read in `@vitest/mocker`'s module mocking). The only fix is
  `npm audit fix --force`, which upgrades to `vitest@5` — a breaking change out of
  scope for this slice.
- **Fix**: Upgrade to vitest 5 in a dedicated change once the v5 migration is
  planned, not as a side effect of adding the first test suite.
  - Strength: `vitest` is a dev-only dependency — it never ships in the deployed
    Azure Functions package (`api-dist/`, per `context/foundation/lessons.md`), so the
    advisory (arbitrary file read via mocked module redirects) has no production
    attack surface.
  - Tradeoff: The vulnerable range stays in `node_modules` for local/CI test runs
    until someone does the v5 upgrade.
  - Confidence: HIGH — dev/test-only dependency, not part of the deployed artifact.
  - Blind spot: Have not audited whether CI runs `npm audit` as a gate; if it does,
    this will need an explicit allowlist entry.
- **Decision**: ACCEPTED AS RISK — dev-only dependency, no production exposure;
  revisit when vitest 5 migration is otherwise justified.
