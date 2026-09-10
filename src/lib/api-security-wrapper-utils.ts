import type { NextRequest } from 'next/server';
import type { ApiSecurityOptions } from './apiSecurity';

export interface ResolvedApiSecurityOptions {
  requireAuth: boolean;
  requirePermission?: string;
  rateLimit: boolean;
  validateInput: boolean;
  logAccess: boolean;
  allowedMethods: string[];
}

export function resolveApiSecurityOptions(options: ApiSecurityOptions = {}): ResolvedApiSecurityOptions {
  return {
    requireAuth: options.requireAuth ?? true,
    requirePermission: options.requirePermission,
    rateLimit: options.rateLimit ?? true,
    validateInput: options.validateInput ?? true,
    logAccess: options.logAccess ?? true,
    allowedMethods: options.allowedMethods ?? ['GET', 'POST', 'PUT', 'DELETE'],
  };
}

export function isBuildUnavailableRequest(req: NextRequest | null | undefined) {
  return process.env.NEXT_PHASE === 'phase-production-build'
    || !req
    || !req.method
    || !req.headers;
}

export function isStateChangingMethod(method: string) {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
}

export function shouldValidateApiInput(method: string, validateInput: boolean) {
  return validateInput && ['POST', 'PUT', 'PATCH'].includes(method);
}

export function hasRequiredApiPermission(
  user: { role?: string | null; modulePermissions?: string[] | null } | null | undefined,
  requirePermission?: string
) {
  if (!requirePermission) {
    return true;
  }

  return user?.role === 'Admin'
    || Boolean(user?.modulePermissions?.includes(requirePermission));
}

export function getInsufficientPermissionMessage(requirePermission: string) {
  return `Insufficient permissions to ${requirePermission.toLowerCase().replace('_', ' ')}`;
}

export function getApiRequestPath(req: NextRequest) {
  return req.nextUrl?.pathname || 'unknown';
}

export function getApiRequestQuery(req: NextRequest) {
  return req.nextUrl?.searchParams ? Object.fromEntries(req.nextUrl.searchParams) : {};
}
