---
change_id: infra-managed-identity
title: Upgrade Storage auth to Managed Identity + RBAC
status: complete
created: 2026-09-13
updated: 2026-09-13
archived_at: null
---

## Notes

Flowerpot MVP currently uses connection string for Storage Account auth. Upgrading to Managed Identity + RBAC for production-grade security and compliance.

Key changes:
- Upgrade SWA to Standard tier (required for managed identity integration)
- Add System-Assigned Managed Identity to SWA in Bicep
- Assign RBAC role `Storage Table Data Contributor` to SWA identity on Storage Account
- Remove connection string output from Bicep
- Update API code to use `@azure/identity` + `@azure/data-tables` with DefaultAzureCredential
- Update local.settings.json to NOT include connection string
- Add CI/CD step in deploy.yml to deploy Bicep BEFORE app build (infra-first pattern)
