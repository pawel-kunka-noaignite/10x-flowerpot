# Flowerpot — Houseplant Care Scheduler (MVP)

**Status**: MVP Complete — Ready for 10xBuilder Certification

A web application that helps you schedule and manage care routines for your houseplant collection. Add plants by species, and the system automatically computes personalized watering, fertilizing, and pruning schedules based on season and light exposure.

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript (PWA-ready)
- **Backend**: Azure Functions (Node.js v4) + TypeScript
- **Data**: Azure Table Storage (multi-tenant, per-user isolation)
- **Auth**: Azure Static Web Apps built-in authentication (Microsoft Entra ID)
- **Monorepo**: npm workspaces with shared type layer

## Key Features

✅ **Authentication** — User login via SWA; per-user data isolation enforced at the database layer.

✅ **Plant CRUD** — Add, view, update, and delete houseplants with customizable light exposure and watering history.

✅ **Smart Care Schedules** — Schedule engine computes watering, fertilizing, and pruning intervals based on:
- Plant species (curated dataset of 20+ common houseplants)
- Current season (4 Northern hemisphere seasons with exact boundaries)
- Light exposure (low, medium, bright) with dynamic multipliers
- Last watering date

✅ **Care Task List** — Displays upcoming tasks per plant with days-until-due calculations.

✅ **Responsive UI** — Protected routes for authenticated users; logout button in header.

## Architecture

```
frontend/          → Vite React SPA (ProtectedRoute → Dashboard → PlantList + AddForm)
api/               → Azure Functions (GET/POST /plants, GET /species, GET /tasks)
shared/            → @flowerpot/shared type definitions (never compiled)
context/
  ├── foundation/  → PRD, tech-stack, test-plan, roadmap
  └── archive/     → Completed changes
```

## Running the Project

### Install & Build

```bash
npm ci
npm run build
```

### Development

```bash
npm run dev                                      # Frontend dev server (http://localhost:5173)
npm run start --workspace @flowerpot/api        # API locally (requires Azure Functions Core Tools)
```

### Testing

```bash
npm test                                       # Run all tests (Vitest)
npm test --workspace @10x-flowerpot/api        # API tests only (47 tests)
npm test --workspace @10x-flowerpot/frontend   # Frontend tests only (30 tests)
```

## Certification Evidence

### ✅ All 5 MVP Criteria Met

| Criterion | Evidence |
|-----------|----------|
| **CRUD** | Plant Create/Read/Update/Delete via API + Table Storage; user-scoped by partition key. |
| **Business Logic** | `scheduleEngine.computeSchedule()` — 36-entry lookup table (4 seasons × 3 lights × 3 actions) with dynamic interval multipliers. |
| **Tests & Risk Plan** | `context/foundation/test-plan.md` defines 3 risks (schedule edge cases, task persistence, user isolation); 77 tests pass (21 schedule engine, 12 careTask repo, 30 frontend, 14 core). |
| **Authentication** | SWA built-in auth via `useAuth` hook; every API query enforces `userId` partition key filtering; 401 on missing auth. |
| **Documentation** | `context/foundation/prd.md` (156 lines) with user stories, requirements, business rules; `test-plan.md`, `tech-stack.md`, roadmap. |

### Pass Rate: 5/5 (100%)

## Deployment

Deployed live at: **https://calm-forest-0fc119503.7.azurestaticapps.net/**

Deployment via GitHub Actions (`.github/workflows/deploy.yml`):
- **Infra-first**: Deploys Bicep (SWA + Storage Account + RBAC) via Azure CLI + OIDC federation
- Builds frontend (Vite) + API (tsc)
- Packages API as self-contained Functions bundle
- Deploys to Azure Static Web Apps (SPA + API)
- Automatic on `main` branch push (excludes `context/` and markdown)

### Authentication: Managed Identity + RBAC

The API uses **Azure Managed Identity** to authenticate with Table Storage (production-grade security, no connection strings):
- SWA has system-assigned managed identity
- Managed identity granted `Storage Table Data Contributor` RBAC role on Storage Account
- API code uses `@azure/identity` + `DefaultAzureCredential` (works in dev, CI/CD, and production)
- See `DEPLOYMENT.md` for OIDC federation setup

## Infrastructure (Bicep IaC)

```
infra/
  ├── main.bicep
  └── resources/
      ├── static-web-app.bicep
      └── storage-account.bicep
```

Run:
```bash
az deployment group create --resource-group 10x-flowerpot-group --template-file infra/main.bicep
```

## Key Decisions

- **Per-user data isolation**: userId as Table Storage partition key (Azure best practice for multi-tenant).
- **Type-only imports from shared**: Prevents CommonJS build issues in Azure Functions.
- **Lookup-table schedule engine**: Domain-expert-tunable vs. algorithmic (easier to adjust intervals by hand).
- **SWA built-in auth**: Zero additional Azure resources; login flow provided by platform.
- **Separate plants + caretasks tables**: Cleaner schema; independent scaling.

## Next Steps (Post-MVP)

- **S-03**: Task completion tracking (mark done, reschedule)
- **S-04**: Reminders + notifications
- **S-05**: Multi-user collaboration / family plant sharing
- **M4/M5** (optional): Architecture deep-dive + GitHub Actions pipeline review

## License

Internal 10xDevs project.
