import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { Plant, CreatePlantDto } from "@10x-flowerpot/shared";
import { getUserId } from "../lib/auth";
import {
  createPlant,
  getPlantsByUserId,
  updatePlant,
  deletePlant,
} from "../data/plantRepository";

/**
 * HTTP handler for plant endpoints.
 * GET: List all plants for the authenticated user
 * POST: Create a new plant for the authenticated user
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
      return {
        status: 201,
        jsonBody: plant,
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
