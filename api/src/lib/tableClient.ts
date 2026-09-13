import { TableClient } from "@azure/data-tables";

/**
 * Initializes and returns a TableClient for the specified table in Azure Table Storage.
 *
 * Uses a connection string rather than managed identity because Azure Static Web
 * Apps' *managed* Functions (our current hosting model) do not support managed
 * identity at all — only "bring your own Functions" does. See DEPLOYMENT.md.
 *
 * Resolution order:
 *   1. `STORAGE_CONNECTION_STRING` app setting (CI/CD injects this at deploy time
 *      using the OIDC-authenticated session, so the key is never stored as a
 *      long-lived GitHub secret).
 *   2. `UseDevelopmentStorage=true` (Azurite emulator, local dev fallback).
 *
 * @param tableName - Name of the table to connect to
 * @returns TableClient instance for the specified table
 */
export function getTableClient(tableName: string): TableClient {
  const connectionString =
    process.env.STORAGE_CONNECTION_STRING ?? "UseDevelopmentStorage=true";

  return TableClient.fromConnectionString(connectionString, tableName);
}
