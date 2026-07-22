# Lessons Learned

Append-only register of recurring rules earned from real incidents. Consumed as a prior by planning and review skills. Newest entries at the bottom; never rewrite prior entries.

## Import @flowerpot/shared as types only across the API boundary

- **Context:** `api/` (Azure Functions, `tsc` CommonJS build) importing from the `shared/` workspace package — implement and impl-review phases.
- **Problem:** `shared/` ships raw `.ts` and is never compiled to JavaScript. A value import from `@flowerpot/shared` in `api/` resolves for type-checking but has no runtime module, which breaks `npm run build --workspace @flowerpot/api`.
- **Rule:** In `api/`, import from `@flowerpot/shared` with `import type { ... }` only. If genuine shared runtime logic is ever needed, add a build step to `shared/` (emit JS + types) before importing values.
- **Applies to:** implement, impl-review, plan

## Deploy Azure Functions v4 to Static Web Apps by letting Oryx detect the language

- **Context:** Deploying the `api/` Azure Functions (Node v4 programming model, `app.http(...)`) to Azure Static Web Apps via the `Azure/static-web-apps-deploy@v1` GitHub Action — first-deploy and CI phases.
- **Problem:** Two traps compound. (1) `frontend/` and `api/` depend on the workspace-only `@flowerpot/shared`, which is never published to npm, so SWA's per-folder Oryx build fails its isolated `npm install`. (2) Pre-building the API and passing `skip_api_build` then fails with `Cannot deploy to the function app because Function language info isn't provided` — the v4 model has no `function.json` files, so skipping Oryx removes the only language/runtime detection.
- **Rule:** Build all workspaces once at the repo root (`npm ci && npm run build`) so `@flowerpot/shared` resolves. Deploy the frontend pre-built with `skip_app_build: true` (`app_location: frontend/dist`). For the API, assemble a self-contained package (`api-dist/`: compiled `dist` + `host.json` + a manifest listing only `@azure/functions` — drop the type-only `@flowerpot/shared`) and do NOT set `skip_api_build`; let Oryx process `api-dist` so it detects Node and provides the language info. `skip_api_build` is not even a valid input on this action.
- **Applies to:** implement, plan, deploy
