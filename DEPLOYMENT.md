# Production Deployment Guide

## Authentication model

CI/CD authenticates to Azure via **GitHub OIDC federation** to the
`10x-flowerpot-group-identity` user-assigned managed identity (see
`infra/resources/group-identity.bicep`), which holds Contributor + RBAC
Administrator on the resource group. No long-lived Azure credentials are
stored in GitHub, except one exception below.

**Table Storage access does NOT use managed identity.** Azure Static Web Apps'
*managed* (built-in) Functions do not support managed identity at all — only
"bring your own Functions" does (see [Azure docs][swa-functions-docs]). Since
switching to a standalone Function App is a bigger architectural change than
this MVP needs, the API instead reads a **storage account connection string**
from the `STORAGE_CONNECTION_STRING` app setting (`api/src/lib/tableClient.ts`).

The CI/CD pipeline fetches this connection string itself, using the
OIDC-authenticated session (which has Contributor → can list storage keys),
and injects it into the Static Web App's app settings on every deploy. The
key is never stored as a GitHub secret.

[swa-functions-docs]: https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions

## GitHub Actions secrets & variables

Repository secrets (`Settings → Secrets and variables → Actions → Secrets`):

```
AZURE_CLIENT_ID:              client ID of 10x-flowerpot-group-identity
AZURE_TENANT_ID:              afd5ed7c-4a41-4a60-a161-9a22f7087a70
AZURE_SUBSCRIPTION_ID:        0062944a-8e10-4dd4-9a69-5ccec140b4e9
AZURE_STATIC_WEB_APP_API_KEY: deploy token from SWA (Settings → Manage deployment token)
```

Repository variables (`Settings → Secrets and variables → Actions → Variables`):

```
AZURE_RESOURCE_GROUP: 10x-flowerpot-group
```

`AZURE_STATIC_WEB_APP_API_KEY` is the one unavoidable long-lived secret —
`Azure/static-web-apps-deploy@v1` requires it and has no OIDC alternative.

## Federated credential subject

GitHub injects immutable org/repo IDs into the OIDC token subject claim, so
the federated credential subject must be the exact string, not just
`repo:<owner>/<repo>:ref:refs/heads/main`. Check the actual value from a
failed login's `AADSTS700213` error, or:

```bash
az identity federated-credential show \
  --name github-oidc \
  --identity-name 10x-flowerpot-group-identity \
  --resource-group 10x-flowerpot-group
```

## Deployment process

1. **Push to `main`** → GitHub Actions triggers (see `.github/workflows/deploy.yml`)
2. **Azure Login** via OIDC (`azure/login@v2` — required explicitly; `azure/cli@v2` does not auto-login)
3. **Bicep deploy** — infra-first, idempotent
4. **Configure Table Storage connection string** — fetches the storage key and sets it as an SWA app setting
5. **Build & test** — root npm workspaces build, then `npm test`
6. **Assemble API deploy package** — self-contained `api-dist/` (shared package is type-only, stripped from the runtime manifest)
7. **Deploy** — `Azure/static-web-apps-deploy@v1` uploads frontend + API

## Verifying the deployment

```bash
curl https://<swa-hostname>/api/health
curl https://<swa-hostname>/api/species
az storage table list --account-name 10xflowerpot --auth-mode login
```

## Local development

`api/local.settings.json` (gitignored) sets `AzureWebJobsStorage=UseDevelopmentStorage=true`.
`getTableClient()` falls back to the same value when `STORAGE_CONNECTION_STRING`
is unset, which works against the Azurite emulator.

## Rollback

```bash
git revert HEAD
git push
```
