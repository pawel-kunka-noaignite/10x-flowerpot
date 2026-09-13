import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { CareTask } from "@10x-flowerpot/shared";
import { getUserId } from "../lib/auth";
import { getCareTasksByUserId, getCareTasksByPlantId } from "../data/careTaskRepository";

/**
 * HTTP handler for care task endpoints.
 * GET: List tasks for the authenticated user (optionally filtered by plantId)
 */
async function tasks(
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
      // Check if plantId query parameter is provided
      const url = new URL(request.url);
      const plantId = url.searchParams.get("plantId");

      let taskList: CareTask[];
      if (plantId) {
        taskList = await getCareTasksByPlantId(userId, plantId);
      } else {
        taskList = await getCareTasksByUserId(userId);
      }

      return {
        status: 200,
        jsonBody: taskList,
      };
    }

    // Method not allowed
    return {
      status: 405,
      jsonBody: { error: "Method Not Allowed" },
    };
  } catch (error) {
    context.log(`Error in tasks handler: ${error}`);

    // Generic error
    return {
      status: 500,
      jsonBody: { error: "Internal server error" },
    };
  }
}

app.http('tasks', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: tasks,
});
