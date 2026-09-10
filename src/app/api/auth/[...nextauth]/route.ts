// src/app/api/auth/[...nextauth]/route.ts
/**
 * NextAuth v5 (Auth.js) Route Handler
 *
 * Wraps Auth.js with sanitized production diagnostics while preserving normal
 * OAuth redirects as successful control flow.
 */

import { handlers } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const SENSITIVE_OAUTH_PARAMS = new Set([
  'code',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'session_state',
  'state',
  'nonce',
]);

function getErrorCause(error: unknown): unknown {
  return error instanceof Error && 'cause' in error
    ? (error as Error & { cause?: unknown }).cause
    : undefined;
}

function sanitizedSearchParams(url: URL): Record<string, string> {
  const sanitized: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    sanitized[key] = SENSITIVE_OAUTH_PARAMS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  });
  return sanitized;
}

function publicRequestUrl(req: NextRequest, parsed: URL): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (!host) return `${parsed.pathname}${parsed.search}`;
  return `${proto}://${host}${parsed.pathname}${parsed.search}`;
}

async function handleRequest(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
): Promise<Response> {
  const parsed = new URL(req.url);
  const diagnosticUrl = publicRequestUrl(req, parsed);

  try {
    if (parsed.pathname.includes('/callback/')) {
      console.log('[NEXTAUTH HANDLER] OAuth callback request:', {
        pathname: parsed.pathname,
        searchParams: sanitizedSearchParams(parsed),
        method: req.method,
        headers: {
          host: req.headers.get('host'),
          referer: req.headers.get('referer'),
          'user-agent': req.headers.get('user-agent'),
        },
      });
    }

    if (parsed.searchParams.has('error')) {
      console.error('[NEXTAUTH HANDLER] OAuth error returned to application:', {
        error: parsed.searchParams.get('error'),
        errorDescription: parsed.searchParams.get('error_description'),
        errorUri: parsed.searchParams.get('error_uri'),
        pathname: parsed.pathname,
        allParams: sanitizedSearchParams(parsed),
      });
    }

    const response = await handler(req);

    // Redirects are normal OAuth control flow. Log only actual client/server errors.
    if (response.status >= 400) {
      const responseClone = response.clone();
      try {
        const responseText = await responseClone.text();
        console.error('[NEXTAUTH HANDLER] Error response from handler:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText.substring(0, 1000),
          url: diagnosticUrl,
        });
      } catch (error) {
        console.error('[NEXTAUTH HANDLER] Failed to read error response body:', error);
      }
    }

    return response;
  } catch (error) {
    console.error('[NEXTAUTH HANDLER] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCause = getErrorCause(error);

    console.error('[NEXTAUTH HANDLER] Error details:', {
      message: errorMessage,
      stack: errorStack,
      cause: errorCause,
      url: diagnosticUrl,
      method: req.method,
    });

    return NextResponse.json(
      {
        error: 'OAuthCallbackError',
        message: 'An error occurred during authentication. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return handleRequest(handlers.POST, req);
}
