import { afterEach, describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";

import { getAllowedOrigin, handleCors } from "./cors";

const ORIGINAL_ENV = process.env;

function setEnv(overrides: Partial<NodeJS.ProcessEnv>) {
  process.env = { ...ORIGINAL_ENV, ...overrides };
}

function requestWithOrigin(origin: string | null): NextRequest {
  return {
    headers: {
      get: (key: string) => key.toLowerCase() === "origin" ? origin : null,
    },
  } as unknown as NextRequest;
}

describe("cors utilities", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("allows configured exact origins and wildcard subdomains", () => {
    setEnv({
      NODE_ENV: "production",
      CORS_ALLOWED_ORIGINS: "https://app.example.com,*.example.org",
    });

    expect(getAllowedOrigin(requestWithOrigin("https://app.example.com"))).toBe("https://app.example.com");
    expect(getAllowedOrigin(requestWithOrigin("https://team.example.org"))).toBe("https://team.example.org");
    expect(getAllowedOrigin(requestWithOrigin("https://blocked.example.net"))).toBeNull();
  });

  it("uses production defaults and Azure AD origins when configured", () => {
    setEnv({
      NODE_ENV: "production",
      CORS_ALLOWED_ORIGINS: undefined,
      NEXTAUTH_URL: "https://studio.example.com",
      AZURE_AD_CLIENT_ID: "client",
      AZURE_AD_CLIENT_SECRET: "secret",
      AZURE_AD_TENANT_ID: "tenant",
    });

    expect(getAllowedOrigin(requestWithOrigin("https://studio.example.com"))).toBe("https://studio.example.com");
    expect(getAllowedOrigin(requestWithOrigin("https://login.microsoftonline.com"))).toBe("https://login.microsoftonline.com");
  });

  it("rejects unconfigured production origins and ignores same-origin requests", () => {
    setEnv({ NODE_ENV: "production", CORS_ALLOWED_ORIGINS: "" });

    expect(getAllowedOrigin(requestWithOrigin("https://hr.example.com"))).toBeNull();
    expect(getAllowedOrigin(requestWithOrigin(null))).toBeNull();
  });

  it("builds CORS headers with development fallback only in development", () => {
    setEnv({ NODE_ENV: "development", CORS_ALLOWED_ORIGINS: "" });
    expect(handleCors(requestWithOrigin("https://blocked.example.com"))).toMatchObject({
      "Access-Control-Allow-Origin": "http://localhost:8021",
      "Access-Control-Allow-Credentials": "true",
    });

    setEnv({ NODE_ENV: "production", CORS_ALLOWED_ORIGINS: "" });
    expect(handleCors(requestWithOrigin("https://blocked.example.com"))).toEqual({});
  });
});
