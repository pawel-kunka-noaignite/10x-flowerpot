import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Initializes and returns a TableClient for the specified table in Azure Table Storage.
 * Uses DefaultAzureCredential, which respects:
 *   - Managed identity (production in Azure)
 *   - Environment variables (AzureWebJobsStorage with emulator in dev)
 *   - Local Azure CLI authentication
 *
 * @param tableName - Name of the table to connect to
 * @param storageAccountName - Name of the storage account (must match infra/resources/storage-account.bicep)
 * @returns TableClient instance for the specified table
 * @throws Error if credentials cannot be resolved or storage account is not configured
 */
export function getTableClient(
  tableName: string,
  storageAccountName: string = "10xflowerpot"
): TableClient {
  const storageUri = `https://${storageAccountName}.table.core.windows.net`;

  // Use DefaultAzureCredential which respects managed identity at runtime,
  // environment variables in CI/dev, and local Azure CLI auth
  return new TableClient(storageUri, tableName, new DefaultAzureCredential());
}
