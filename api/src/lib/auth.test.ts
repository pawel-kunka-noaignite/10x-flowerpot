import { describe, it, expect } from "vitest";
import type { HttpRequest } from "@azure/functions";
import { getUserId } from "./auth";

function fakeRequest(headers: Record<string, string>): HttpRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as HttpRequest;
}

describe("getUserId", () => {
  it("decodes the userId from a valid x-ms-client-principal header", () => {
    const principal = { userId: "abc123", userDetails: "zosia@example.com" };
    const header = Buffer.from(JSON.stringify(principal), "utf-8").toString("base64");

    const request = fakeRequest({ "x-ms-client-principal": header });

    expect(getUserId(request)).toBe("abc123");
  });

  it("returns null when the header is missing", () => {
    const request = fakeRequest({});

    expect(getUserId(request)).toBeNull();
  });

  it("returns null when the header is not valid base64 JSON", () => {
    const request = fakeRequest({ "x-ms-client-principal": "not-base64-json" });

    expect(getUserId(request)).toBeNull();
  });
});
