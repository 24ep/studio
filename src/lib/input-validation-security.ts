import { NextRequest } from "next/server";

export function validateRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000,
): boolean {
  return true;
}

export function escapeSqlIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, "");
}

export function escapeSqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateCsrfToken(request: NextRequest, token: string): boolean {
  const csrfToken = request.headers.get("x-csrf-token");
  return csrfToken === token;
}
