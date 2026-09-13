import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

/**
 * Initializes and returns a TableClient for the specified table in Azure Table Storage.
 * Reads the connection string from the environment variable `AzureWebJobsStorage`,
 * which is set by Azure Functions runtime and local.settings.json in development.
 *
 * @param tableName - Name of the table to connect to (e.g., "10xflowerpotdata")
 * @returns TableClient instance for the specified table
 * @throws Error if AzureWebJobsStorage is not configured
 */
export function getTableClient(tableName: string): TableClient {
  const connectionString = process.env.AzureWebJobsStorage;
  
  if (!connectionString) {
    throw new Error(
      "AzureWebJobsStorage environment variable is not set. " +
      "Ensure it is configured in local.settings.json (dev) or App Settings (production)."
    );
  }

  return TableClient.fromConnectionString(connectionString, tableName);
}
