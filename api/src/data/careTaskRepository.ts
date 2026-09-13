import { randomUUID } from "crypto";
import { getTableClient } from "../lib/tableClient";
import type { CareTask, CareAction } from "@10x-flowerpot/shared";

const TABLE_NAME = "flowerpottasks";

/**
 * Creates a new care task for a plant.
 *
 * @param userId - The owner's unique identifier (partition key)
 * @param plantId - The plant's unique identifier
 * @param action - Type of care action (water, fertilize, prune)
 * @param dueAt - When this task is due (ISO date string)
 * @returns The created CareTask entity
 * @throws Error if Table Storage operation fails
 */
export async function createCareTask(
  userId: string,
  plantId: string,
  action: CareAction,
  dueAt: Date
): Promise<CareTask> {
  const taskId = randomUUID();
  const dueAtIso = dueAt.toISOString().split("T")[0]; // Store as YYYY-MM-DD

  const task: CareTask = {
    id: taskId,
    plantId,
    action,
    dueAt: dueAtIso,
    completedAt: null,
  };

  const client = getTableClient(TABLE_NAME);

  // Table Storage entity with partition key (userId) and row key (task id)
  const entity = {
    partitionKey: userId,
    rowKey: taskId,
    ...task,
  };

  await client.createEntity(entity);

  return task;
}

/**
 * Retrieves all care tasks for a given plant owned by a user.
 *
 * @param userId - The owner's unique identifier (partition key)
 * @param plantId - The plant's unique identifier
 * @returns Array of CareTask entities (empty if no tasks)
 * @throws Error if Table Storage operation fails
 */
export async function getCareTasksByPlantId(
  userId: string,
  plantId: string
): Promise<CareTask[]> {
  const client = getTableClient(TABLE_NAME);

  // Query by partition key (userId) and filter by plantId
  const filter = `PartitionKey eq '${userId}' and plantId eq '${plantId}'`;
  const tasks: CareTask[] = [];

  for await (const entity of client.listEntities<Record<string, string>>({
    queryOptions: { filter },
  })) {
    tasks.push({
      id: entity.rowKey,
      plantId: entity.plantId,
      action: entity.action as CareAction,
      dueAt: entity.dueAt,
      completedAt: entity.completedAt || null,
    });
  }

  return tasks;
}

/**
 * Retrieves all care tasks owned by a user.
 *
 * @param userId - The owner's unique identifier (partition key)
 * @returns Array of CareTask entities (empty if no tasks)
 * @throws Error if Table Storage operation fails
 */
export async function getCareTasksByUserId(userId: string): Promise<CareTask[]> {
  const client = getTableClient(TABLE_NAME);

  const filter = `PartitionKey eq '${userId}'`;
  const tasks: CareTask[] = [];

  for await (const entity of client.listEntities<Record<string, string>>({
    queryOptions: { filter },
  })) {
    tasks.push({
      id: entity.rowKey,
      plantId: entity.plantId,
      action: entity.action as CareAction,
      dueAt: entity.dueAt,
      completedAt: entity.completedAt || null,
    });
  }

  return tasks;
}
