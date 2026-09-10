import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { saveApiKeys, getApiKeyStats } from '@/lib/aiApiKeyManager';
import { getSelectedAiProvider, type AiProvider } from '@/lib/aiProvider';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  deduplicateApiKeyUpdates,
  getErrorMessage,
  hasDuplicateApiKeyPriorities,
  hasDuplicateApiKeyValues,
  isRecord,
  parseApiKeyUpdates,
  resolveAiApiKeysGetProvider,
  resolveAiApiKeysProvider,
} from './ai-api-keys-route-utils';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/settings/ai-api-keys:
 *   get:
 *     summary: Get AI API keys with statistics
 *     responses:
 *       200:
 *         description: AI API keys and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   post:
 *     summary: Update AI API keys
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: AI API keys updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'AI_INTEGRATION_EDIT')) {
    await logAudit('WARN', `Forbidden attempt to access AI API keys by user ${session?.user?.email || 'Unknown'}.`, 'API:AiApiKeys:Get', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const selectedProvider = await getSelectedAiProvider();
    const provider = resolveAiApiKeysGetProvider(
      request.nextUrl.searchParams.get('provider'),
      selectedProvider,
    );
    const stats = await getApiKeyStats(provider);
    
    return NextResponse.json({
      provider,
      selectedProvider,
      apiKeys: stats,
      totalKeys: stats.length,
      activeKeys: stats.filter(key => key.isActive).length,
      environmentKey: false // Environment keys are not used
    });
  } catch (error) {
    console.error('[AI API KEYS] Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user, 'AI_INTEGRATION_EDIT')) {
    await logAudit('WARN', `Forbidden attempt to update AI API keys by user ${session?.user?.email || 'Unknown'}.`, 'API:AiApiKeys:Update', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value;
    const apiKeys = isRecord(body) ? body.apiKeys : undefined;
    const provider = isRecord(body) ? body.provider : undefined;
    const resolvedProvider: AiProvider = resolveAiApiKeysProvider(provider);

    if (!Array.isArray(apiKeys)) {
      return NextResponse.json(
        { error: 'Invalid request: apiKeys must be an array' },
        { status: 400 }
      );
    }

    const validApiKeys = parseApiKeyUpdates(apiKeys);

    if (hasDuplicateApiKeyPriorities(validApiKeys)) {
      return NextResponse.json(
        { error: 'Invalid request: Duplicate priorities found' },
        { status: 400 }
      );
    }

    if (hasDuplicateApiKeyValues(validApiKeys)) {
      const reorderedKeys = deduplicateApiKeyUpdates(validApiKeys);
      await saveApiKeys(reorderedKeys, resolvedProvider);
      
      return NextResponse.json({
        success: true,
        provider: resolvedProvider,
        message: "Duplicate API keys removed. Priorities have been reassigned.",
        apiKeys: reorderedKeys,
        removedDuplicates: validApiKeys.length - reorderedKeys.length
      }, { status: 200 });
    }

    await saveApiKeys(validApiKeys, resolvedProvider);

    // Log the update
    await logAudit('AUDIT', `${resolvedProvider} AI API keys updated by ${session.user.name}. Total keys: ${validApiKeys.length}`, 'API:AiApiKeys:Update', session.user.id, {
      provider: resolvedProvider,
      keyCount: validApiKeys.length,
      priorities: validApiKeys.map(key => key.priority)
    });

    // Return updated stats
    const stats = await getApiKeyStats(resolvedProvider);
    
    return NextResponse.json({
      success: true,
      provider: resolvedProvider,
      message: `Successfully updated ${validApiKeys.length} API keys`,
      apiKeys: stats,
      totalKeys: stats.length,
      activeKeys: stats.filter(key => key.isActive).length
    });

  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[AI API KEYS] Error updating API keys:', error);
    await logAudit('ERROR', `Failed to update AI API keys by ${session.user?.name || session?.user?.email || 'Unknown'}. Error: ${errorMessage}`, 'API:AiApiKeys:Update', session?.user?.id);
    return NextResponse.json(
      { error: 'Failed to update AI API keys' },
      { status: 500 }
    );
  }
}
