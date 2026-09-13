import type { HttpRequest } from "@azure/functions";

interface ClientPrincipal {
  userId: string;
}

/**
 * Extracts the acting user's id from Azure Static Web Apps' injected
 * `x-ms-client-principal` header. SWA sets this header itself for requests it
 * has authenticated and proxied through, so it cannot be forged by an
 * external caller hitting the SWA domain directly.
 *
 * Returns `null` (never throws) when the header is absent or malformed, so
 * callers can treat "no user id" as "unauthenticated" uniformly.
 */
export function getUserId(request: HttpRequest): string | null {
  const header = request.headers.get("x-ms-client-principal");
  if (!header) {
    return null;
  }

  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    const principal = JSON.parse(decoded) as Partial<ClientPrincipal>;
    return principal.userId ?? null;
  } catch {
    return null;
  }
}
