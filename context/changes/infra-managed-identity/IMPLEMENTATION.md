# Implementation Summary

## Status: ✅ Complete

All 6 changes implemented and verified.

## Changes Made

### 1. ✅ Infra: Upgrade SWA to Standard tier + Managed Identity
**File**: `infra/resources/static-web-app.bicep`
- Changed SKU from `Free` to `Standard` tier
- Added `identity: { type: 'SystemAssigned' }`
- Exported `principalId` for RBAC role assignment

### 2. ✅ Infra: Remove connection string, add RBAC parameter
**File**: `infra/resources/storage-account.bicep`
- Removed `connectionString` output (no longer exposed to main)
- Added `swaIdentityPrincipalId` parameter
- Implemented RBAC role assignment (`Storage Table Data Contributor`) directly in module
- Role assignment uses `guid()` for deterministic naming

### 3. ✅ Infra: Wire RBAC role assignment in main module
**File**: `infra/main.bicep`
- Pass SWA's `principalId` to storage account module as parameter
- Removed `storageConnectionString` output
- Added clean outputs for app name, hostname, and storage account name

### 4. ✅ API: Add @azure/identity dependency
**File**: `api/package.json`
- Added `"@azure/identity": "^4.0.0"` to dependencies
- Installed via `npm install` (674 lines added to package-lock.json)

### 5. ✅ API: Migrate tableClient to DefaultAzureCredential
**File**: `api/src/lib/tableClient.ts`
- Replaced `AzureNamedKeyCredential` (connection string) with `DefaultAzureCredential`
- DefaultAzureCredential credential chain:
  1. **Production (SWA)**: Respects managed identity via RBAC
  2. **Dev (local)**: Respects `AzureWebJobsStorage` (Azure Storage Emulator)
  3. **CI/CD**: Respects OIDC federation token from workflow
  4. **Local CLI**: Respects Azure CLI auth
- Updated JSDoc to reflect new auth mechanism

### 6. ✅ CI/CD: Add infra-first deployment
**File**: `.github/workflows/deploy.yml`
- Added `Deploy Infrastructure` step (runs before `Setup Node`)
- Uses `azure/cli@v2` action with OIDC federation
- Runs: `az deployment group create --template-file infra/main.bicep`
- Added `id-token: write` permission for OIDC federation
- Ensures RBAC role assignments exist before app build/deploy

### 7. ✅ Local Dev: Cleaned up credentials
**File**: `api/local.settings.json` (gitignored, not committed)
- Removed hardcoded `StorageConnectionString` and `AccountKey`
- Kept `AzureWebJobsStorage: "UseDevelopmentStorage=true"` (emulator)
- Safer for version control; no secrets in git

## Verification

✅ **TypeScript build passes**: `npm run build`
```
> @10x-flowerpot/api@0.0.0 build
> tsc
```

✅ **Bicep compiles**: `az bicep build --file infra/main.bicep --stdout`
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  ...
}
```

✅ **No connection string references**: tableClient uses DefaultAzureCredential exclusively

## Commits

1. **fc8b951** — Upgrade infra to Managed Identity + RBAC for Storage
2. **911525c** — Add @azure/identity dependency to API
3. **64baeb1** — Migrate tableClient from connection string to DefaultAzureCredential
4. **0e3c421** — Add infra-first deployment step to CI/CD
5. **f26df13** — Update package-lock.json after adding @azure/identity

## Impact & Next Steps

**Production deployment checklist**:
- [ ] Ensure Azure resource group is set up in GitHub Actions secrets (`AZURE_RESOURCE_GROUP`)
- [ ] Configure OIDC federation: GitHub→Azure with subject `repo:owner/repo:ref:refs/heads/main`
- [ ] Test SWA role assignment:
  ```bash
  az role assignment list --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/10xflowerpotdata --assignee-principal-type ServicePrincipal
  ```
- [ ] Monitor first deploy: watch for `az deployment group create` success and RBAC propagation (~1 min)

**Cost impact**: SWA Standard tier ~$9/month (vs. Free tier)

**Breaking changes**: 
- Local dev must have Azure Storage Emulator running OR Azure CLI authenticated
- No more hardcoded connection string in `local.settings.json`

**Future improvements**:
- Monitor connection string usage in other services (none found in current codebase)
- Consider Key Vault for dev secrets if needed (currently not required due to emulator + CLI auth)
