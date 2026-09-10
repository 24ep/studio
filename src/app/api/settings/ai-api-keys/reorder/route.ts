import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  getKnownReorderApiKeysErrorResponse,
  logFailedApiKeyReorder,
  logSuccessfulApiKeyReorder,
  parseReorderApiKeysBody,
  toReorderApiKeysError,
  validateAndSaveReorderedApiKeys,
} from './reorder-route-helpers';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/settings/ai-api-keys/reorder:
 *   post:
 *     summary: Reorder AI API keys by priority
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apiKeys:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     priority:
 *                       type: number
 *     responses:
 *       200:
 *         description: API keys reordered successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Server error
 */

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'AI_INTEGRATION_EDIT')) {
    await logAudit('WARN', `Forbidden attempt to reorder AI API keys by user ${session?.user?.email || 'Unknown'}.`, 'API:AiApiKeys:Reorder', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const requestData = parseReorderApiKeysBody(bodyResult.value);
    if (requestData.response) {
      return requestData.response;
    }

    const saveResult = await validateAndSaveReorderedApiKeys(requestData.input);
    if (saveResult.response) {
      return saveResult.response;
    }

    await logSuccessfulApiKeyReorder(session.user, saveResult.provider, requestData.input);
    
    return NextResponse.json({ 
      message: "API keys reordered successfully",
      apiKeys: requestData.input.apiKeys
    }, { status: 200 });

  } catch (error: unknown) {
    const apiKeyError = toReorderApiKeysError(error);
    console.error("Failed to reorder AI API keys:", error);

    const knownErrorResponse = getKnownReorderApiKeysErrorResponse(error, apiKeyError);
    if (knownErrorResponse) {
      return knownErrorResponse;
    }
    
    await logFailedApiKeyReorder(session.user, apiKeyError);
    
    return NextResponse.json({ 
      message: "Error reordering AI API keys", 
      error: apiKeyError.message 
    }, { status: 500 });
  }
}
