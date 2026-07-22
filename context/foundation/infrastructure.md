---
project: Flowerpot
researched_at: 2026-07-22
recommended_platform: Azure Static Web Apps
runner_up: Azure Container Apps
context_type: mvp
tech_stack:
  language: TypeScript
  framework: React (Vite SPA) + Azure Functions (Node v4 model)
  runtime: Node.js 20+
---

## Recommendation

**Deploy on Azure Static Web Apps (Free tier), region West Europe.**

The stack is a unified-TypeScript SPA (`frontend/`, Vite + React) plus a request/response HTTP API (`api/`, Azure Functions Node v4 model). Static Web Apps is purpose-built for exactly this shape: it serves the SPA from a global edge network and hosts the co-located Azure Functions as the `/api` backend under one resource, one deploy, one custom domain. It is the only platform in the pool that runs the Functions Node v4 programming model natively — every alternative would require porting the API to a different function runtime. The Free tier costs $0, which makes region a non-cost decision; West Europe is chosen because Static Web Apps is not available in Poland Central and West Europe is the closest, most mature EU region.

## Platform Comparison

The hard constraint is the API runtime: the backend is written against the **Azure Functions Node v4 programming model** (`app.http(...)` registrations, one HTTP function per file). Platforms that cannot run this model natively incur a rewrite of every endpoint, so they are scored down on "Managed/Serverless fit for THIS stack" even where they are excellent generic hosts.

| Platform | CLI-first | Managed/Serverless fit | Agent-readable docs | Stable deploy API | MCP / Integration | Total |
|---|---|---|---|---|---|---|
| Azure Static Web Apps | Pass | Pass | Partial | Pass | Partial | 4.5 |
| Azure Container Apps | Pass | Partial | Partial | Pass | Partial | 3.5 |
| Cloudflare (Pages + Workers) | Pass | Fail* | Pass | Pass | Pass | 3.0 |
| Vercel | Pass | Fail* | Pass | Pass | Partial | 2.5 |
| Netlify | Pass | Fail* | Pass | Pass | Fail | 2.0 |
| Fly.io | Pass | Partial | Partial | Pass | Fail | 2.5 |

\* "Fail" here is stack-specific, not a quality judgment: these are strong hosts for the React SPA, but none run the Azure Functions Node v4 model — the API would have to be rewritten to Workers / Vercel Functions / Netlify Functions. That rewrite is the disqualifier for an MVP whose backend already exists.

### Shortlisted Platforms

#### 1. Azure Static Web Apps (Recommended)

Runs the SPA and the existing Azure Functions Node v4 API under a single resource with zero backend rewrite. First-class GitHub Actions integration: creating the resource emits a deploy token and a ready-made workflow. Free tier ($0) covers the MVP (100 GB bandwidth/month, custom domain, managed SSL). Built-in auth exists but we are deliberately using our own Entra External ID + MSAL instead (see Operational Story). Loses half a point on docs (Microsoft Learn is thorough but JS-rendered, not `llms.txt`) and on MCP (Azure MCP exists but is not needed for MVP).

#### 2. Azure Container Apps (Runner-up)

Same cloud, same subscription, same region — so identity, billing, and networking stay consistent with the recommended path. Would let us run the API as a container with persistent processes if the app ever outgrew the serverless request/response model. Scored below SWA because it needs a Dockerfile and its own static-hosting story (the SPA would go to Blob Storage + CDN or be bundled into the container), i.e. more moving parts than SWA gives for free today. Kept as the natural escalation target if SWA's constraints bite.

#### 3. Cloudflare (Pages + Workers)

Best-in-class edge CLI (`wrangler`), agent-readable docs, and MCP support — the strongest "agent-friendly" score on paper. Third only because adopting it means rewriting every Azure Functions handler to the Workers model and splitting the deploy across Pages (static) and Workers (API), which are not interchangeable commands. Reasonable if we ever abandon the Azure ecosystem; not justified when the API already targets Azure Functions and the credits are Azure credits.

## Anti-Bias Cross-Check: Azure Static Web Apps

### Devil's Advocate — Weaknesses

1. **Managed Functions are a constrained subset of Azure Functions.** SWA's integrated API does not support every trigger/binding (e.g. Durable Functions, some timer/queue scenarios are limited or unavailable). If Flowerpot's care-scheduling ever needs a background/timer job to compute overdue tasks, the integrated API may not host it and we would need a standalone Function App linked to SWA — extra resource, extra config.
2. **No native managed database.** SWA hosts compute + static content, not data. Persistence (Cosmos DB, Azure SQL, or Postgres Flexible Server) is a separate resource, separately billed, and its free/cheap tiers have their own limits. The "one resource" simplicity stops at the data layer.
3. **Free tier has hard ceilings and no SLA.** 100 GB/month bandwidth, limited staging environments, and no uptime guarantee. Fine for a course MVP, but a single mistake (e.g. large asset, hotlinking) can exhaust it, and there is no burst headroom without moving to Standard ($9/app/mo).
4. **Deploy token is a broad secret.** The SWA deployment token in GitHub Secrets can push to production. If leaked, an attacker can deploy arbitrary content. It is not scoped per-environment as tightly as one might want.
5. **Custom auth (Entra External + MSAL) means we opt out of SWA's easy path.** By not using built-in auth we take on token validation, redirect config, and CORS between the SPA and the API ourselves — more surface for misconfiguration than the zero-config route.

### Pre-Mortem — How This Could Fail

Six months out, Flowerpot's deploy is "done" but brittle. The care-scheduling rule grew a nightly recompute of overdue tasks; the SWA integrated API could not host a timer trigger cleanly, so a standalone Function App was bolted on, and now there are two APIs with two auth configs and drifting CORS. The Entra External tenant, set up quickly during the course, was never properly configured for token lifetime and multi-environment redirect URIs, so preview deploys can't log users in and every PR requires a manual redirect-URI edit in the tenant. The private subscription sits inside the employer's `noaignite.com` tenant; a well-meaning cleanup of "unknown personal resources" by corporate IT nearly deletes the Static Web App. Meanwhile the data layer — an afterthought in this document — turned out to dominate cost and complexity, and the "$0 SWA" framing hid that the real bill was Cosmos/SQL all along. None of these are SWA defects; they are the consequences of treating deployment as solved once the URL was green.

### Unknown Unknowns

- **SWA "managed Functions" ≠ full Azure Functions.** Runtime version and binding support lag standalone Function Apps; the Node v4 model is supported but check binding-level parity before relying on advanced triggers.
- **Preview/staging environments consume auth config.** Each named environment gets its own URL, which must be registered as a redirect URI in the Entra External tenant — MSAL will silently fail auth on any unregistered preview URL.
- **A resource in a corporate tenant is subject to corporate policy.** Azure Policy, Defender, or governance in `noaignite.com` can appear later and block or flag resource operations you expect to be free actions.
- **Region ≠ where static content is served.** West Europe is where the managed Functions and metadata live; the SPA is edge-served globally regardless — so "region" affects API latency and data residency, not frontend speed.
- **Free tier staging-environment count is small.** Heavy PR-preview workflows can hit the environment cap; plan for Standard if preview-per-PR becomes core to the workflow.

## Operational Story

- **Preview deploys**: SWA auto-creates a staging environment per pull request (branch build → unique preview URL) via the generated GitHub Actions workflow. Caveat: each preview URL must be registered as a redirect URI in the Entra External tenant or MSAL login will fail on that preview. Free tier caps the number of concurrent staging environments.
- **Secrets**: The SWA **deployment token** lives in **GitHub Secrets** (`AZURE_STATIC_WEB_APPS_API_TOKEN`), injected into the Actions workflow — never committed. Frontend needs the Entra **client/tenant IDs** (public, safe to ship as build-time config). Any API-side secrets (DB connection string) go in SWA **application settings** (portal or `az staticwebapp appsettings set`), not in the repo. `api/local.settings.json` stays gitignored.
- **Rollback**: Re-run a previous successful GitHub Actions deploy (or revert the commit and let Actions redeploy) — production returns to the prior build in minutes. Caveat: this rolls back code, not data; any DB schema/migration change is not reverted automatically and must be handled by hand.
- **Approval**: Human-only actions — creating the SWA resource, generating/rotating the deployment token, creating/configuring the Entra External tenant, deleting the resource, and choosing the target subscription. The agent may run `npm run build`, edit the workflow, and open PRs; it must not create Azure resources, rotate secrets, or push to production unattended.
- **Logs**: Build/deploy logs via GitHub Actions (`gh run view <id> --log`). Runtime API logs via `az staticwebapp` / Application Insights if enabled (`az monitor app-insights` queries) — read-only from the CLI.

## Infrastructure as Code

Infrastructure is described as **Bicep** (Azure-native, no remote-state backend to manage — chosen over Terraform because the project is Azure-only). The environment is reproducible from `infra/*.bicep` via `az deployment group create`, so dev/prod become the same template with different parameters.

- **Tenant**: `thenorthalliance.com` (group tenant; account `pawel.kunka@noaignite.com`). Subscription: private Visual Studio subscription inside that tenant.
- **Provisioning path (not the portal wizard)**: Bicep provisions the resource → retrieve the SWA deployment token (`az staticwebapp secrets list`) → store it once in GitHub Secrets (`gh secret set`) → a hand-authored GitHub Actions workflow builds and deploys. This keeps the resource reproducible and CLI-scriptable rather than click-provisioned.
- **Scope now (M1L5)**: `infra/main.bicep` provisions only the Static Web App (Free, West Europe). Data-layer resources (storage / SQL) and managed identity are added to Bicep in M2 alongside persistence.

## Naming Convention

Resource names are **decided by the human before creation** — the agent proposes, never creates a resource under an unconfirmed name. Convention: prefix `10x-flowerpot-`; for resources that disallow hyphens (e.g. storage accounts: 3–24 lowercase alphanumeric, globally unique) use `10xflowerpot`.

| Resource | Name |
|---|---|
| Resource group | `10x-flowerpot-group` |
| Static Web App | `10x-flowerpot-swa` |
| Function App (future, option B) | `10x-flowerpot-functions` |
| Storage account (future) | `10xflowerpot` |
| SQL Server (future) | `10x-flowerpot-sql` |

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Deploying into the wrong (corporate prod) subscription inside `noaignite.com` | Research finding | M | H | Explicitly select the private VS subscription in `az account set` before any deploy; confirm subscription ID in the deploy plan and workflow. |
| Corporate policy/governance in `noaignite.com` blocks or flags resource ops | Unknown unknowns | M | M | Verify resource creation succeeds early; if blocked, fall back to a personal Azure Free tenant. Keep all project resources in one clearly-named resource group. |
| SWA managed Functions can't host a future timer/background job | Devil's advocate | M | M | Keep API request/response for MVP; if a scheduled recompute is needed, link a standalone Function App (documented escalation) rather than forcing it into SWA. |
| SWA managed Functions cannot use a managed identity → no passwordless IAM to Storage/SQL | Research finding | M | M | Acceptable for MVP (connection string in SWA app settings). If passwordless IAM to the data layer is wanted, escalate to a standalone Function App (option B) — see Signal to Change Decision. |
| Entra External preview redirect URIs not registered → MSAL login fails on previews | Pre-mortem | M | M | Register a wildcard/known preview URL scheme up front; document the "add redirect URI" step per new environment. |
| Data layer cost/complexity underestimated ("$0 SWA" hides real bill) | Pre-mortem | M | M | Pick the data store deliberately in M2 with its own free-tier limits noted; do not treat persistence as free. |
| Leaked SWA deployment token allows arbitrary production deploy | Devil's advocate | L | H | Store only in GitHub Secrets; rotate via portal (human action) if exposure suspected; never echo in logs. |
| Free tier bandwidth/environment ceilings exhausted | Unknown unknowns | L | M | Monitor usage; keep assets small; upgrade to Standard ($9/app/mo) only if PR-preview or traffic demands it. |

## Signal to Change Decision

Stay on **option A (SWA managed Functions)** while it is good enough. Switch to **option B (standalone `10x-flowerpot-functions` Function App linked as SWA backend)** when any of these becomes true:

- **Passwordless IAM to the data layer is required** — managed identity + RBAC on Storage/SQL is only possible with a standalone Function App. This decision is made deliberately in **M2** when the data store is chosen.
- A **timer / queue / Durable** trigger is needed (managed Functions don't host these).
- Migration cost is low: function code (Node v4) is unchanged and the frontend still calls `/api/*`; only the backend topology and deploy change.

## Getting Started

Concrete first steps to deploy Flowerpot to Static Web Apps (human performs the account/resource steps; agent assists with build + workflow):

1. **Select the right subscription:** `az login` (account `pawel.kunka@noaignite.com`, tenant `noaignite.com`), then `az account set --subscription "<private VS subscription>"` and confirm with `az account show`.
2. **Create the resource group and Static Web App:** `az group create -n rg-flowerpot -l westeurope`, then create the SWA linked to the GitHub repo (`az staticwebapp create ... --location westeurope --app-location "frontend" --api-location "api" --output-location "dist"`), or use the portal's "Static Web App → GitHub" wizard which also writes the Actions workflow.
3. **Confirm the generated GitHub Actions workflow** in `.github/workflows/` builds `frontend` (output `dist`) and picks up `api`; verify `AZURE_STATIC_WEB_APPS_API_TOKEN` landed in GitHub Secrets.
4. **Create the Entra External ID tenant** for end-user auth (separate from the resource tenant); register the SPA app, capture client/tenant IDs, and add the production + preview redirect URIs.
5. **Push to `main`** and watch the Action deploy; verify the public URL serves the SPA and `/api/health` responds. Record the URL and subscription ID in `context/deployment/deploy-plan.md`.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup (the GitHub Actions workflow is scaffolded by SWA; hardening/gates come in M5)
- Data-layer selection (Cosmos DB vs Azure SQL vs Postgres) — deferred to M2
- Production-scale architecture (multi-region, HA, DR)
