import { randomUUID } from "crypto";
import { TableClient } from "@azure/data-tables";
import { getTableClient } from "../lib/tableClient";
import type { Plant, CreatePlantDto, LightExposure } from "@10x-flowerpot/shared";

const TABLE_NAME = "flowerpotdata";

/**
 * Validates a CreatePlantDto object.
 * @throws Error with descriptive message if validation fails
 */
export function validatePlantDto(dto: CreatePlantDto): void {
  if (!dto.speciesId || typeof dto.speciesId !== "string") {
    throw new Error("Missing or invalid required field: speciesId");
  }
  
  if (!dto.nickname || typeof dto.nickname !== "string") {
    throw new Error("Missing or invalid required field: nickname");
  }
  
  if (!dto.lightExposure || typeof dto.lightExposure !== "string") {
    throw new Error("Missing or invalid required field: lightExposure");
  }
  
  const validExposures: LightExposure[] = ["low", "medium", "bright"];
  if (!validExposures.includes(dto.lightExposure)) {
    throw new Error(
      `Invalid lightExposure: "${dto.lightExposure}". Must be one of: ${validExposures.join(", ")}`
    );
  }
  
  if (!dto.lastWateredAt || typeof dto.lastWateredAt !== "string") {
    throw new Error("Missing or invalid required field: lastWateredAt");
  }
  
  // Validate ISO date string using Date.parse
  // A valid ISO date will parse to a number; invalid strings parse to NaN
  const timestamp = Date.parse(dto.lastWateredAt);
  if (isNaN(timestamp)) {
    throw new Error(
      `Invalid lastWateredAt: "${dto.lastWateredAt}". Must be a valid ISO date string (e.g., "2026-09-13" or "2026-09-13T10:30:00Z")`
    );
  }
}

/**
 * Creates a new plant for the given user.
 * @param userId - The owner's unique identifier (partition key)
 * @param dto - Plant data transfer object with required fields
 * @returns The created Plant entity
 * @throws Error if validation fails or Table Storage operation fails
 */
export async function createPlant(
  userId: string,
  dto: CreatePlantDto
): Promise<Plant> {
  validatePlantDto(dto);

  const plantId = randomUUID();
  
  const plant: Plant = {
    id: plantId,
    ownerId: userId,
    speciesId: dto.speciesId,
    nickname: dto.nickname,
    lightExposure: dto.lightExposure,
    lastWateredAt: dto.lastWateredAt,
  };

  const client = getTableClient(TABLE_NAME);
  
  // Table Storage entity with partition key (userId) and row key (plant id)
  const entity = {
    partitionKey: userId,
    rowKey: plantId,
    ...plant,
  };

  await client.createEntity(entity);
  
  return plant;
}

/**
 * Retrieves all plants owned by the given user.
 * @param userId - The owner's unique identifier (partition key)
 * @returns Array of Plant entities (empty if no plants)
 * @throws Error if Table Storage operation fails
 */
export async function getPlantsByUserId(userId: string): Promise<Plant[]> {
  const client = getTableClient(TABLE_NAME);
  
  const filter = `PartitionKey eq '${userId}'`;
  const plants: Plant[] = [];

  for await (const entity of client.listEntities<Record<string, string>>({
    queryOptions: { filter },
  })) {
    plants.push({
      id: entity.rowKey,
      ownerId: entity.partitionKey,
      speciesId: entity.speciesId,
      nickname: entity.nickname,
      lightExposure: entity.lightExposure as LightExposure,
      lastWateredAt: entity.lastWateredAt,
    });
  }

  return plants;
}

/**
 * Updates a plant with partial data.
 * @param userId - The owner's unique identifier (partition key)
 * @param plantId - The plant's identifier (row key)
 * @param partial - Partial plant data to merge
 * @returns The updated Plant entity
 * @throws Error if entity not found or Table Storage operation fails
 */
export async function updatePlant(
  userId: string,
  plantId: string,
  partial: Partial<Plant>
): Promise<Plant> {
  const client = getTableClient(TABLE_NAME);

  // Fetch the existing entity
  const existing = await client.getEntity<Record<string, string>>(
    userId,
    plantId
  );

  // Merge partial fields, preserving key fields
  const updated = {
    partitionKey: userId,
    rowKey: plantId,
    id: existing.id,
    ownerId: existing.ownerId,
    speciesId: partial.speciesId ?? existing.speciesId,
    nickname: partial.nickname ?? existing.nickname,
    lightExposure: partial.lightExposure ?? existing.lightExposure,
    lastWateredAt: partial.lastWateredAt ?? existing.lastWateredAt,
  };

  await client.updateEntity(updated, "Replace");

  return {
    id: updated.id,
    ownerId: updated.ownerId,
    speciesId: updated.speciesId,
    nickname: updated.nickname,
    lightExposure: updated.lightExposure as LightExposure,
    lastWateredAt: updated.lastWateredAt,
  };
}

/**
 * Deletes a plant.
 * @param userId - The owner's unique identifier (partition key)
 * @param plantId - The plant's identifier (row key)
 * @throws Error if Table Storage operation fails
 */
export async function deletePlant(
  userId: string,
  plantId: string
): Promise<void> {
  const client = getTableClient(TABLE_NAME);
  
  await client.deleteEntity(userId, plantId);
}
