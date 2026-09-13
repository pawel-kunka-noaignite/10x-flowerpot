import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { SPECIES_SEED } from "../data/speciesSeed";

export async function species(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Species lookup for url "${request.url}"`);

    return { jsonBody: SPECIES_SEED };
};

app.http('species', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: species
});
