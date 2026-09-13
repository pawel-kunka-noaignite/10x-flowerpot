---
change_id: infra-github-oidc
title: Setup GitHub OIDC federation with managed identity
status: new
created: 2026-09-13
updated: 2026-09-13
archived_at: null
---

## Notes

Replace long-lived secrets in GitHub Actions with OIDC federation + User-Assigned Managed Identity in Azure.

Key changes:
- Create User-Assigned Managed Identity (`10x-flowerpot-group-identity`) in resource group
- Configure OIDC federated credential (GitHub → identity token exchange)
- Organize infrastructure modules: separate `resources/` and `roles/` (including `roles/privileged/` for sensitive roles)
- Add deploymentTrigger parameter to main.bicep to distinguish manual (dev) from automatic (CI/CD) infrastructure setup
- Update GitHub Actions workflow to authenticate via OIDC (no stored secrets needed)
- Generate unique storage account names using `uniqueString(resourceGroup().id)`
- Add RBAC condition to restrict role assignments (future enhancement)
