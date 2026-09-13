# Production Deployment Guide: Managed Identity + RBAC

## Prerequisite: GitHub OIDC Federation Setup

Before triggering a deploy, configure GitHub Actions OIDC federation for Azure:

```bash
# 1. Set environment variables
export APP_NAME="10x-flowerpot-swa"
export RESOURCE_GROUP="10x-flowerpot-group"
export SUBSCRIPTION_ID="0062944a-8e10-4dd4-9a69-5ccec140b4e9"
export TENANT_ID="afd5ed7c-4a41-4a60-a161-9a22f7087a70"
export GITHUB_REPO="<owner>/<repo>"  # e.g., PawelKunka/10xDevs

# 2. Create Azure AD Application for GitHub Actions
az ad app create --display-name "github-actions-flowerpot" \
  --query appId -o tsv > app-id.txt
APP_ID=$(cat app-id.txt)

# 3. Create Service Principal
az ad sp create --id $APP_ID --query id -o tsv > sp-id.txt
SP_ID=$(cat sp-id.txt)

# 4. Grant Contributor role to service principal on resource group
az role assignment create \
  --role "Contributor" \
  --assignee $SP_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"

# 5. Setup OIDC federation (GitHub → Azure AD)
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-flowerpot",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_REPO"':ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"],
    "description": "GitHub Actions for Flowerpot CI/CD"
  }'

echo "APP_ID=$APP_ID"
echo "SERVICE_PRINCIPAL_ID=$SP_ID"
```

## GitHub Actions Secrets

Add these to your GitHub repository secrets (`Settings → Secrets and variables → Actions`):

```
AZURE_CLIENT_ID:         <APP_ID from above>
AZURE_TENANT_ID:         afd5ed7c-4a41-4a60-a161-9a22f7087a70
AZURE_SUBSCRIPTION_ID:   0062944a-8e10-4dd4-9a69-5ccec140b4e9
AZURE_RESOURCE_GROUP:    10x-flowerpot-group
AZURE_STATIC_WEB_APP_API_KEY: <deploy token from SWA, Settings → Manage deployment token>
```

## Deployment Process

1. **Push to main** → GitHub Actions triggers
2. **Bicep Deploy Step** (infra-first):
   - Logs in via OIDC federation
   - Deploys `infra/main.bicep`
   - Upgrades SWA to Standard (if needed)
   - Assigns Managed Identity + RBAC role
3. **App Build Step**:
   - Builds frontend (Vite)
   - Builds API (tsc, CommonJS)
   - Packages API as self-contained bundle
4. **SWA Deploy Step**:
   - Deploys frontend dist + API dist
   - SWA uses Managed Identity for Table Storage access

## Verifying Managed Identity Access

After first deploy, verify the SWA can access Table Storage:

```bash
# 1. Get SWA's managed identity object ID
SWA_PRINCIPAL_ID=$(az resource show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --resource-type "Microsoft.Web/staticSites" \
  --query identity.principalId -o tsv)

echo "SWA Principal ID: $SWA_PRINCIPAL_ID"

# 2. Check RBAC role assignment
az role assignment list \
  --assignee $SWA_PRINCIPAL_ID \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --output table

# 3. Verify API can reach Table Storage (check app logs)
az staticwebapp logs --resource-group $RESOURCE_GROUP --name $APP_NAME
```

## Rollback (If Needed)

If deployment fails, revert the Bicep state:

```bash
# Redeploy previous bicep version (git revert + push)
git revert HEAD
git push

# Or manually downgrade SWA (via portal if necessary)
az resource update \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --resource-type "Microsoft.Web/staticSites" \
  --set sku.name=Free
```

## Local Development

For local development, `DefaultAzureCredential` will use:

1. **Environment variables** (if `AZURE_STORAGE_ACCOUNT_NAME` is set)
2. **Azure CLI credentials** (if you're logged in: `az login`)
3. **Managed Identity** (if running on Azure VM/Container)
4. **Storage Emulator** (Azurite, if configured)

To test locally with real Storage Account:

```bash
# Ensure you're logged in to the correct tenant/subscription
az login --tenant thenorthalliance.com

# Start the API locally
npm run start --workspace @flowerpot/api

# API will use your local Azure CLI credentials to access Table Storage
```

## Cost Impact

- **SWA Standard tier**: ~$9/month (vs. Free tier)
  - Includes managed identity support
  - Higher staging slots and custom domains
  - Worth it for multi-tenant prod workload

## Security Notes

✅ **No connection strings in code** — All secrets removed.
✅ **RBAC enforcement** — SWA identity can only read/write Table Storage (no blob, no queues).
✅ **OIDC federation** — No long-lived secrets needed in GitHub.
✅ **Per-environment auth** — Same code works in dev (CLI creds), CI/CD (OIDC), and prod (managed identity).

---

**Next**: Run this deployment after confirming OIDC federation is set up.
