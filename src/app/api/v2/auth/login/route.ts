/**
 * V2 API Login Endpoint
 * 
 * Authenticates using API key and returns the same response format as v1 login.
 * Supports API key via:
 * - Request body: { "apiKey": "sk_live_..." }
 * - Header: X-API-Key: sk_live_...
 * - Header: Authorization: Bearer sk_live_... (for n8n compatibility)
 * 
 * This endpoint is designed for external system/service integration (e.g., n8n, Zapier).
 */

import { NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';
import { handleCors } from '@/lib/cors';
import { validateApiKey } from '@/lib/systemApiKeyManager';
import { 
  SimpleErrorHandler,
  createValidationError, 
  createUnauthorizedError, 
  createInternalServerError 
} from '@/lib/errors';
import {
  buildApiKeyTokenIdentity,
  calculateTokenExpiration,
  extractApiKey,
  getClientIp,
  isAllowedApiKeyFormat,
  logV2AuthAudit,
} from './login-route-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v2/auth/login
 * 
 * Authenticate with an API key and receive a JWT token.
 * Response format matches v1 /api/v1/auth/login for compatibility.
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  
  // Extract API key from request
  const apiKey = await extractApiKey(req);
  
  if (!apiKey) {
    return SimpleErrorHandler.handleApiError(
      req, 
      createValidationError('API key is required. Provide via X-API-Key header, Authorization: Bearer header, or request body.')
    );
  }
  
  // Quick format validation
  if (!isAllowedApiKeyFormat(apiKey)) {
    await logV2AuthAudit('WARN', 'Invalid API key format attempted', {
      ip: clientIp,
      keyPrefix: apiKey.substring(0, 8),
    });
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Invalid API key format'));
  }
  
  // Check NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    return SimpleErrorHandler.handleApiError(
      req, 
      createInternalServerError('Server misconfiguration: NEXTAUTH_SECRET is not set')
    );
  }
  
  try {
    // Validate the API key
    const validation = await validateApiKey(apiKey, clientIp);
    
    if (!validation.valid || !validation.data) {
      await logV2AuthAudit('WARN', `Failed v2 API login: ${validation.error}`, {
        ip: clientIp,
        error: validation.error,
      });
      return SimpleErrorHandler.handleApiError(req, createUnauthorizedError(validation.error || 'Invalid API key'));
    }
    
    const keyData = validation.data;
    const tokenIdentity = buildApiKeyTokenIdentity(keyData);
    
    // Generate JWT token (same format as v1)
    const isSecure = process.env.NODE_ENV === 'production';
    const salt = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
    
    const token = await encode({
      token: {
        ...tokenIdentity,
        apiKeyId: keyData.id,
        // Set expiration to 1 hour from now (or key expiration if sooner)
        exp: calculateTokenExpiration(keyData.expiresAt),
        iat: Math.floor(Date.now() / 1000),
      },
      secret: process.env.NEXTAUTH_SECRET,
      salt,
    });
    
    await logV2AuthAudit(
      'AUDIT',
      `API key "${keyData.name}" authenticated via v2 API`,
      { keyId: keyData.id, keyPrefix: keyData.keyPrefix, ip: clientIp }
    );
    
    // Return response matching v1 format
    return SimpleErrorHandler.createSuccessResponse(req, { 
      success: true, 
      token, 
      tokenType: 'JWE',
      expiresIn: 3600, // 1 hour in seconds
      user: tokenIdentity,
    }, 200);
    
  } catch (error) {
    console.error('[V2 Auth] Error during authentication:', error);
    await logV2AuthAudit('ERROR', `V2 API authentication error: ${getErrorMessage(error)}`, { ip: clientIp });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Error during authentication'));
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
