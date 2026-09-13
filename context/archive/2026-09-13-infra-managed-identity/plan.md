# Implementation Plan: Managed Identity + RBAC for Storage Access

## Objective
Upgrade Flowerpot's Storage Account authentication from connection strings to Managed Identity + RBAC for production-grade security and compliance.

## Current State
- **SWA SKU**: Free tier (does not support managed identity)
- **Storage Auth**: Connection string via `AzureWebJobsStorage` and `StorageConnectionString` in `local.settings.json`
- **API Code**: `getTableClient()` uses `AzureNamedKeyCredential` from connection string
- **Bicep**: Outputs connection string; no managed identity assigned
- **CI/CD**: No infra-first deployment; app build happens first

## Changes

### 1. Upgrade SWA to Standard tier and enable managed identity
**File**: `infra/resources/static-web-app.bicep`
- Change SKU from `Free` to `Standard`
- Add `identity` block: `type: 'SystemAssigned'`
- Output the SWA resource ID (needed for RBAC role assignment in main.bicep)

### 2. Output storage account resource info for RBAC
**File**: `infra/resources/storage-account.bicep`
- Remove `connectionString` output (no longer needed)
- Add `resourceId` output to enable RBAC role assignment

### 3. Add RBAC role assignment in main module
**File**: `infra/main.bicep`
- After both modules are deployed, add a `roleAssignment` resource:
  - Scope: storage account resource ID
  - Role Definition ID: `Storage Table Data Contributor` (built-in, ID: `0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3`)
  - Principal ID: SWA's managed identity principal ID
- Remove `storageConnectionString` output from main

### 4. Update API tableClient to use DefaultAzureCredential
**File**: `api/src/lib/tableClient.ts`
- Add dependency: `@azure/identity` (need to add to `api/package.json`)
- Change from `AzureNamedKeyCredential` to `DefaultAzureCredential`
- DefaultAzureCredential respects:
  - Managed identity (production)
  - Environment variables (CI/CD, local dev with emulator)
  - Local Azure CLI/Azurite auth
- Update JSDoc to reflect new auth mechanism

### 5. Update local development settings
**File**: `api/local.settings.json`
- Remove `StorageConnectionString` (no longer used)
- Keep `AzureWebJobsStorage: "UseDevelopmentStorage=true"` (enables local Storage Emulator)
- Add table service URI for completeness if needed

### 6. Add infra-first CI/CD step
**File**: `.github/workflows/deploy.yml`
- Add new step after checkout (before npm install/build): `Deploy Infrastructure`
  - Uses `azure/cli@v2` action
  - Runs: `az deployment group create --resource-group ... --template-file infra/main.bicep`
  - This ensures RBAC role assignments exist before API tries to access tables
- Add required permissions: `contents: read`, `id-token: write` (for OIDC federation)

## Success Criteria
✅ `npm run build` passes without connection string references  
✅ Bicep validates: `az bicep build-params` and `az deployment group validate`  
✅ SWA identity can read/write Table Storage via RBAC in production  
✅ Local dev works with emulator via `DefaultAzureCredential`  
✅ CI/CD deploys infra before app (infra-first pattern)  

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| SWA upgrade from Free→Standard may cause billing | Accepted; Standard is necessary for managed identity |
| Breaking change for local dev if emulator not running | Documented; dev must have Storage Emulator running or use Azure auth |
| RBAC role assignment fails silently | CI/CD validates deployment; catch in PR checks |
| DefaultAzureCredential credential chain order | Ensure `AzureWebJobsStorage` is set for emulator priority in dev |

## Dependencies
- `@azure/identity` (need to install in api/package.json)
- Azure CLI in CI/CD (already available in ubuntu-latest runner)
- Service principal with permissions to create role assignments (OIDC federation token)

## Notes
- Connection string removal is a breaking change for any hardcoded references — grep for "DefaultEndpointsProtocol" before/after
- SWA Standard tier incurs cost (~$9/month); verify with team
- Local.settings.json will not include secrets going forward (safer for git)
