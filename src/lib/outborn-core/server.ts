import 'server-only';

import { cookies } from 'next/headers';
import { encode, getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

import { refreshOutbornAccountAccessToken } from '../auth-outborn-account-token';
import { resolveHriveOrganization, type OutbornAccountIdentity } from './context';

const SESSION_COOKIE_NAME = 'next-auth.session-token';
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const OUTBORN_REFRESH_EARLY_SECONDS = 5 * 60;
const DEFAULT_REQUEST_TIMEOUT_MS = 7_000;

export class OutbornServiceError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'OutbornServiceError';
  }
}

export interface OutbornRequestContext {
  accessToken: string;
  organizationId: string;
  identity: OutbornAccountIdentity;
}

function normalizeServiceUrl(value: string | undefined, name: string): string {
  const trimmed = value?.trim().replace(/\/+$/, '') || '';
  if (!trimmed) throw new OutbornServiceError(503, `${name} is not configured.`);
  const parsed = new URL(trimmed);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new OutbornServiceError(503, `${name} must use http or https.`);
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') throw new OutbornServiceError(503, `${name} must use https in production.`);
  return trimmed;
}

function accountBaseUrl() {
  return normalizeServiceUrl(process.env.OUTBORN_ACCOUNT_AUTH_URL || process.env.OUTBORN_ACCOUNT_BASE_URL, 'Outborn Account');
}

function coreBaseUrl() {
  return normalizeServiceUrl(process.env.OUTBORN_CORE_URL || process.env.OUTBORN_CORE_BASE_URL, 'Outborn Core');
}

function requestTimeoutMs(): number {
  const configured = Number(process.env.OUTBORN_SERVICE_REQUEST_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 60_000
    ? Math.trunc(configured)
    : DEFAULT_REQUEST_TIMEOUT_MS;
}

async function jsonBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

async function currentAccountAccessToken(request: NextRequest): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new OutbornServiceError(503, 'NEXTAUTH_SECRET is not configured.');

  const token = await getToken({
    req: request,
    secret,
    cookieName: SESSION_COOKIE_NAME,
    salt: SESSION_COOKIE_NAME,
  });
  const accessToken = typeof token?.outbornAccountAccessToken === 'string'
    ? token.outbornAccountAccessToken
    : '';
  if (!accessToken || !token) {
    throw new OutbornServiceError(401, 'Sign in with Outborn Account to access commercial settings.');
  }

  const expiresAt = typeof token.outbornAccountAccessTokenExpiresAt === 'number'
    ? token.outbornAccountAccessTokenExpiresAt
    : undefined;
  const now = Math.floor(Date.now() / 1000);
  if (!expiresAt || expiresAt > now + OUTBORN_REFRESH_EARLY_SECONDS) return accessToken;

  const refreshToken = typeof token.outbornAccountRefreshToken === 'string'
    ? token.outbornAccountRefreshToken
    : '';
  if (!refreshToken) {
    if (expiresAt <= now) {
      throw new OutbornServiceError(401, 'Your Outborn Account authorization expired. Sign in again.');
    }
    return accessToken;
  }

  try {
    const refreshed = await refreshOutbornAccountAccessToken(refreshToken);
    token.outbornAccountAccessToken = refreshed.accessToken;
    token.outbornAccountAccessTokenExpiresAt = refreshed.expiresAt;
    token.outbornAccountRefreshToken = refreshed.refreshToken;
    delete token.outbornAccountTokenError;

    const encoded = await encode({
      token,
      secret,
      salt: SESSION_COOKIE_NAME,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, encoded, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https://'),
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return refreshed.accessToken;
  } catch (error) {
    if (expiresAt > now) {
      console.warn(
        '[OUTBORN CORE] Early Account token refresh failed; using the still-valid access token:',
        error instanceof Error ? error.message : error,
      );
      return accessToken;
    }
    throw new OutbornServiceError(
      401,
      error instanceof Error
        ? `Your Outborn Account authorization could not be refreshed: ${error.message}`
        : 'Your Outborn Account authorization could not be refreshed. Sign in again.',
    );
  }
}

export async function getOutbornRequestContext(request: NextRequest): Promise<OutbornRequestContext> {
  const accessToken = await currentAccountAccessToken(request);

  let response: Response;
  try {
    response = await fetch(`${accountBaseUrl()}/api/account/identity`, {
      method: 'GET',
      headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(requestTimeoutMs()),
    });
  } catch (error) {
    throw new OutbornServiceError(503, error instanceof Error ? `Outborn Account is unavailable: ${error.message}` : 'Outborn Account is unavailable.');
  }
  const body = await jsonBody(response);
  if (!response.ok) throw new OutbornServiceError(response.status === 401 ? 401 : 502, errorMessage(body, 'Unable to resolve Outborn Account identity.'), body);

  const identity = body as OutbornAccountIdentity;
  if (!identity?.principal?.userId || !Array.isArray(identity.organizations)) {
    throw new OutbornServiceError(502, 'Outborn Account returned an invalid identity response.');
  }
  const organization = resolveHriveOrganization(identity.organizations);
  return { accessToken, organizationId: organization.id, identity };
}

export async function coreRequest<T>(
  context: OutbornRequestContext,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  headers.set('authorization', `Bearer ${context.accessToken}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${coreBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(requestTimeoutMs()),
    });
  } catch (error) {
    throw new OutbornServiceError(503, error instanceof Error ? `Outborn Core is unavailable: ${error.message}` : 'Outborn Core is unavailable.');
  }
  const body = await jsonBody(response);
  if (!response.ok) throw new OutbornServiceError(response.status, errorMessage(body, `Outborn Core request failed (${response.status}).`), body);
  return body as T;
}

export function organizationCorePath(context: OutbornRequestContext, suffix: string) {
  return `/v1/organizations/${encodeURIComponent(context.organizationId)}/${suffix.replace(/^\/+/, '')}`;
}
