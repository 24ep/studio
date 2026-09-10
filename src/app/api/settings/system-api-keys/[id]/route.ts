/**
 * System API Key Individual Operations Endpoint
 * 
 * Handles single API key operations:
 * GET    - Get API key details
 * PATCH  - Update API key (name, description, permissions, isActive)
 * DELETE - Permanently delete API key
 */

import { NextRequest } from 'next/server';
import { 
  getApiKeyById, 
  updateApiKey, 
  deleteApiKey
} from '@/lib/systemApiKeyManager';
import { 
  SimpleErrorHandler,
  createNotFoundError,
  createInternalServerError 
} from '@/lib/errors';
import { requireSystemApiKeyAdmin } from '../system-api-keys-route-auth';
import { parseUpdateSystemApiKeyRequest } from '../system-api-keys-route-request';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/system-api-keys/[id]
 * 
 * Get a single API key's details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permission = await requireSystemApiKeyAdmin(req);
  if (!permission.ok) {
    return permission.response;
  }
  
  const { id } = await params;
  
  try {
    const apiKey = await getApiKeyById(id);
    
    if (!apiKey) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('API key not found'));
    }
    
    return SimpleErrorHandler.createSuccessResponse(req, {
      success: true,
      data: {
        ...apiKey,
        maskedKey: `${apiKey.keyPrefix}...`
      }
    }, 200);
  } catch (error) {
    console.error('[SystemApiKeys] Error getting API key:', error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to get API key'));
  }
}

/**
 * PATCH /api/settings/system-api-keys/[id]
 * 
 * Update an API key
 * 
 * Body:
 * {
 *   "name": "Updated Name",
 *   "description": "Updated description",
 *   "permissions": ["read:applicants"],
 *   "role": "api_user",
 *   "isActive": true,
 *   "expiresAt": "2025-12-31T23:59:59Z" | null
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permission = await requireSystemApiKeyAdmin(req);
  if (!permission.ok) {
    return permission.response;
  }
  
  const { id } = await params;
  
  try {
    // Check if API key exists
    const existing = await getApiKeyById(id);
    if (!existing) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('API key not found'));
    }
    
    const parsedRequest = await parseUpdateSystemApiKeyRequest(req);
    if (!parsedRequest.ok) {
      return parsedRequest.response;
    }
    
    const updated = await updateApiKey(id, parsedRequest.input, permission.userId);
    
    if (!updated) {
      return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to update API key'));
    }
    
    return SimpleErrorHandler.createSuccessResponse(req, {
      success: true,
      message: 'API key updated successfully',
      data: {
        ...updated,
        maskedKey: `${updated.keyPrefix}...`
      }
    }, 200);
  } catch (error) {
    console.error('[SystemApiKeys] Error updating API key:', error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to update API key'));
  }
}

/**
 * DELETE /api/settings/system-api-keys/[id]
 * 
 * Permanently delete an API key
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permission = await requireSystemApiKeyAdmin(req);
  if (!permission.ok) {
    return permission.response;
  }
  
  const { id } = await params;
  
  try {
    const deleted = await deleteApiKey(id, permission.userId);
    
    if (!deleted) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('API key not found'));
    }
    
    return SimpleErrorHandler.createSuccessResponse(req, {
      success: true,
      message: 'API key deleted successfully'
    }, 200);
  } catch (error) {
    console.error('[SystemApiKeys] Error deleting API key:', error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError('Failed to delete API key'));
  }
}
