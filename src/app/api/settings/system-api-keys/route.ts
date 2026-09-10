/**
 * System API Keys CRUD Endpoint
 * 
 * Manages system API keys for v2 API authentication.
 * 
 * GET  - List all API keys (masked)
 * POST - Create a new API key (returns full key only once)
 */

import { NextRequest } from 'next/server';
import { 
  listApiKeys, 
  createApiKey
} from '@/lib/systemApiKeyManager';
import { 
  SimpleErrorHandler,
  createInternalServerError 
} from '@/lib/errors';
import { requireSystemApiKeyAdmin } from './system-api-keys-route-auth';
import { parseCreateSystemApiKeyRequest } from './system-api-keys-route-request';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/system-api-keys
 * 
 * List all API keys with their metadata (keys are masked)
 */
export async function GET(req: NextRequest) {
  const permission = await requireSystemApiKeyAdmin(req);
  if (!permission.ok) {
    return permission.response;
  }
  
  try {
    const apiKeys = await listApiKeys();
    
    return SimpleErrorHandler.createSuccessResponse(req, {
      success: true,
      data: {
        apiKeys: apiKeys.map(key => ({
          ...key,
          // Mask the key prefix for display
          maskedKey: `${key.keyPrefix}...`
        }))
      }
    }, 200);
  } catch (error) {
    console.error('[SystemApiKeys] Error listing API keys:', error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to list API keys'));
  }
}

/**
 * POST /api/settings/system-api-keys
 * 
 * Create a new API key
 * 
 * Body:
 * {
 *   "name": "My Integration",
 *   "description": "API key for n8n integration",
 *   "permissions": ["read:Applicants", "write:Applicants"],
 *   "role": "api_user",
 *   "expiresAt": "2025-12-31T23:59:59Z" | null (never expires)
 * }
 */
export async function POST(req: NextRequest) {
  const permission = await requireSystemApiKeyAdmin(req);
  if (!permission.ok) {
    return permission.response;
  }
  
  try {
    const parsedRequest = await parseCreateSystemApiKeyRequest(req);
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }
    
    // Create the API key
    const result = await createApiKey({
      ...parsedRequest.input,
      createdById: permission.userId
    });
    
    if (!result.success) {
      return SimpleErrorHandler.handleApiError(req, createInternalServerError(result.error || 'Failed to create API key'));
    }
    
    // Return the full API key (only shown once!)
    return SimpleErrorHandler.createSuccessResponse(req, {
      success: true,
      message: 'API key created successfully. Save this key - it will only be shown once!',
      apiKey: result.apiKey, // Full key - save it now!
      data: {
        ...result.data,
        maskedKey: `${result.data?.keyPrefix}...`
      }
    }, 201);
  } catch (error) {
    console.error('[SystemApiKeys] Error creating API key:', error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to create API key'));
  }
}
