# Plan: Setup GitHub OIDC federation with managed identity

**Change ID**: `infra-github-oidc`  
**Complexity**: MEDIUM (infrastructure + CI/CD + security patterns)  
**Risk**: LOW (dev-only for manual setup; GA features)

## Goal

Replace GitHub Actions long-lived secrets with OIDC federation + User-Assigned Managed Identity. Enable CI/CD to deploy infrastructure (Bicep) without storing deployment tokens.

## Key Decisions

1. **User-Assigned Managed Identity** (not system-assigned to SWA)
   - Rationale: Dedicated identity for GitHub Actions OIDC federation; SWA keeps its own system-assigned identity for runtime access to Storage.
   - Scope: Resource group level (can assign roles on any resource in the group or beyond).

2. **Federated Credential on Identity** (not Azure AD app registration)
   - Rationale: Simpler, no long-lived secrets; GitHub OIDC token exchanged directly for access token by Azure AD.
   - Subject: `repo:pawel-kunka-noaignite/10x-flowerpot:ref:refs/heads/main` (main branch only).

3. **Module Organization: resources/ + roles/** (with roles/privileged/ for sensitive)
   - Rationale: Clear separation of concerns; role assignments grouped by sensitivity level.
   - Structure:
     - `resources/` — Azure resources (SWA, Storage, identity references)
     - `roles/` — role assignments (standard)
     - `roles/privileged/` — high-privilege role assignments (RBAC Admin, Contributor)

4. **deploymentTrigger Parameter** (Manual vs. Automatic)
   - Rationale: Developer can run manual setup (identity + roles); CI/CD skips role assignments and only deploys app infrastructure.
   - Default: `Manual` (safe for local dev).

5. **Unique Storage Account Name**
   - Rationale: Storage account names are globally unique. Use `uniqueString(resourceGroup().id)` for deterministic, collision-free naming.

6. **RBAC Condition** (future)
   - Rationale: Restrict RBAC Admin to assign only Storage Table Data Contributor role (least privilege).
   - Status: Prepared (syntax verified against Azure portal); can be enabled later.

## Breakdown

### Phase 1: Azure CLI Setup (Manual, dev-only)
- Create User-Assigned Managed Identity: `10x-flowerpot-group-identity`
- Configure OIDC federated credential (GitHub issuer → Azure AD token exchange)
- Assign Contributor role on resource group

### Phase 2: Bicep Refactoring (Code)
- Move identity reference to `resources/group-identity.bicep` (existing resource pattern)
- Create `roles/resource-group-contributor.bicep` and `roles/privileged/rbac-administrator.bicep`
- Add `roles/privileged/rbac-administrator.bicep` with RBAC condition (prepare, don't enforce yet)
- Add `resources/storage-account.bicep` to use `uniqueString()` for name generation
- Update `main.bicep` with `deploymentTrigger` parameter and conditional module loading

### Phase 3: GitHub Actions (CI/CD)
- Update `.github/workflows/deploy.yml` to use OIDC authentication
- Pass AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID from GitHub Secrets
- azure/cli@v2 automatically exchanges OIDC token for access token (no manual auth step needed)

### Phase 4: Verification & Documentation
- Test Bicep deployment (manual deploymentTrigger=Manual)
- Verify OIDC token exchange logs
- Update DEPLOYMENT.md with OIDC setup steps

## Success Criteria

- ✅ Bicep builds without errors
- ✅ Manual deployment (deploymentTrigger=Manual) creates identity + roles without conflict
- ✅ CI/CD deployment (deploymentTrigger=Automatic) authenticates via OIDC, no stored secrets leaked in logs
- ✅ Infrastructure modules follow separation of concerns (resources, roles, privileged)
- ✅ GitHub Actions workflow uses managed identity + OIDC
