import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { Plant, CreatePlantDto, PlantWithTasksResponse } from "@10x-flowerpot/shared";
import { getUserId } from "../lib/auth";
import {
  createPlant,
  getPlantsByUserId,
  updatePlant,
  deletePlant,
} from "../data/plantRepository";
import { createCareTask } from "../data/careTaskRepository";
import { computeSchedule } from "../lib/scheduleEngine";
import { getSpeciesById } from "../data/speciesSeed";

/**
 * HTTP handler for plant endpoints.
 * GET: List all plants for the authenticated user
 * POST: Create a new plant for the authenticated user (with initial schedule)
 */
async function plants(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const userId = getUserId(request);

  if (!userId) {
    return {
      status: 401,
      jsonBody: { error: "Unauthenticated" },
    };
  }

  try {
    if (request.method === "GET") {
      const plantList = await getPlantsByUserId(userId);
      return {
        status: 200,
        jsonBody: plantList,
      };
    }

    if (request.method === "POST") {
      const body = await request.json();
      const dto = body as CreatePlantDto;
      const plant = await createPlant(userId, dto);

      // Compute schedule and create initial care tasks
      const species = getSpeciesById(dto.speciesId);
      if (!species) {
        context.log(`Warning: Species ${dto.speciesId} not found in seed data`);
        // Return plant without tasks if species not found
        return {
          status: 201,
          jsonBody: { plant, initialTasks: [] } as PlantWithTasksResponse,
        };
      }

      const now = new Date();
      const schedule = computeSchedule(plant, species, now);

      const initialTasks = [];
      for (const scheduledTask of schedule) {
        try {
          const task = await createCareTask(
            userId,
            plant.id,
            scheduledTask.action,
            scheduledTask.dueAt
          );
          initialTasks.push(task);
        } catch (taskError) {
          context.log(
            `Warning: Failed to create ${scheduledTask.action} task for plant ${plant.id}: ${taskError}`
          );
          // Continue creating other tasks even if one fails
        }
      }

      const response: PlantWithTasksResponse = {
        plant,
        initialTasks,
      };

      return {
        status: 201,
        jsonBody: response,
      };
    }

    // Method not allowed
    return {
      status: 405,
      jsonBody: { error: "Method Not Allowed" },
    };
  } catch (error) {
    context.log(`Error in plants handler: ${error}`);

    if (error instanceof Error) {
      // Validation errors return 400
      if (error.message.includes("required") || error.message.includes("Invalid")) {
        return {
          status: 400,
          jsonBody: { error: error.message },
        };
      }
    }

    // Generic error
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http('plants', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: plants,
});
