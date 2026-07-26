import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { HealthResponse } from "@10x-flowerpot/shared";

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Health check for url "${request.url}"`);

    const body: HealthResponse = { status: "ok", service: "10x-flowerpot-api" };

    return { jsonBody: body };
};

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: health
});
