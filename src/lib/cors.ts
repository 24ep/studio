import { NextRequest } from "next/server";

const DEVELOPMENT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8021",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8021",
] as const;

const AZURE_AD_CORS_ORIGINS = [
  "https://login.microsoftonline.com",
  "https://login.microsoft.com",
  "https://sts.windows.net",
  "https://graph.microsoft.com",
] as const;

const ALWAYS_ALLOWED_WILDCARD_PATTERNS: readonly string[] = [];
const CORS_DEVELOPMENT_FALLBACK_ORIGIN = "http://localhost:8021";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
} as const;

function getAllowedOrigins(): string[] {
  const configuredOrigins = getConfiguredCorsOrigins();
  const origins = configuredOrigins.length > 0 ? configuredOrigins : getDefaultCorsOrigins();

  return isAzureAdConfigured()
    ? appendMissingOrigins(origins, AZURE_AD_CORS_ORIGINS)
    : origins;
}

function getConfiguredCorsOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

function getDefaultCorsOrigins() {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : [];
  }

  return [...DEVELOPMENT_CORS_ORIGINS];
}

function isAzureAdConfigured() {
  return Boolean(
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID,
  );
}

function appendMissingOrigins(origins: string[], additionalOrigins: readonly string[]) {
  const originSet = new Set(origins);
  additionalOrigins.forEach((origin) => originSet.add(origin));
  return Array.from(originSet);
}

function matchesWildcardPattern(origin: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) {
    return false;
  }

  const originHost = getOriginHostname(origin);
  if (!originHost) {
    return false;
  }

  const domain = pattern.substring(2);
  return originHost === domain || originHost.endsWith(`.${domain}`);
}

function getOriginHostname(origin: string) {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

function matchesAnyWildcardPattern(origin: string, patterns: readonly string[]) {
  return patterns.some((pattern) => matchesWildcardPattern(origin, pattern));
}

export function getAllowedOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    return null;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  if (matchesAnyWildcardPattern(origin, allowedOrigins) || matchesAnyWildcardPattern(origin, ALWAYS_ALLOWED_WILDCARD_PATTERNS)) {
    return origin;
  }

  return null;
}

export function handleCors(req: NextRequest): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(req);
  const corsOrigin = allowedOrigin || getDevelopmentCorsFallbackOrigin();

  if (!corsOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    ...CORS_HEADERS,
  };
}

function getDevelopmentCorsFallbackOrigin() {
  return process.env.NODE_ENV === "development" ? CORS_DEVELOPMENT_FALLBACK_ORIGIN : null;
}
