# Lessons Learned

Append-only register of recurring rules earned from real incidents. Consumed as a prior by planning and review skills. Newest entries at the bottom; never rewrite prior entries.

## Import @flowerpot/shared as types only across the API boundary

- **Context:** `api/` (Azure Functions, `tsc` CommonJS build) importing from the `shared/` workspace package — implement and impl-review phases.
- **Problem:** `shared/` ships raw `.ts` and is never compiled to JavaScript. A value import from `@flowerpot/shared` in `api/` resolves for type-checking but has no runtime module, which breaks `npm run build --workspace @flowerpot/api`.
- **Rule:** In `api/`, import from `@flowerpot/shared` with `import type { ... }` only. If genuine shared runtime logic is ever needed, add a build step to `shared/` (emit JS + types) before importing values.
- **Applies to:** implement, impl-review, plan
