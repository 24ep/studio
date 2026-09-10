import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { getAvailableModels, getFallbackModels, getSelectedAiProvider, type AiProvider } from '@/lib/aiProvider';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/ai/available-models:
 *   get:
 *     summary: Get available AI models
 *     description: Fetches the list of available models for the selected AI provider
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Model name
 *                       displayName:
 *                         type: string
 *                         description: Human-readable model name
 *                       description:
 *                         type: string
 *                         description: Model description
 *                       supportedGenerationMethods:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Supported generation methods
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const canManageSystemSettings = !!session?.user && hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT');
    const canManageAiIntegration = !!session?.user && hasPermission(session.user, 'AI_INTEGRATION_EDIT');
    
    if (!session?.user || (!canManageSystemSettings && !canManageAiIntegration)) {
      // console.log('Access denied - insufficient permissions for model fetching');
      await logAudit('WARN', `Forbidden attempt to fetch available models by user ${session?.user?.email || 'Unknown'}.`, 'API:AvailableModels:Fetch', session?.user?.id);
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const requestedProvider = request.nextUrl.searchParams.get('provider');
    const provider: AiProvider = requestedProvider === 'openai'
      ? 'openai'
      : requestedProvider === 'deepseek'
        ? 'deepseek'
        : requestedProvider === 'gemini'
          ? 'gemini'
          : await getSelectedAiProvider();

    const result = await executeWithApiKeyFallback(
      async (apiKey, _model, activeProvider) => getAvailableModels(activeProvider, apiKey),
      'Fetch Available Models',
      provider
    );

    if (!result.success) {
      console.warn('Falling back to bundled models because live model fetch failed:', result.error);
      const fallbackModels = getFallbackModels(provider);

      await logAudit(
        'WARN',
        `Falling back to bundled ${provider} models for ${session.user.name}.`,
        'API:AvailableModels:Fallback',
        session.user.id,
        {
          provider,
          reason: result.error,
          attempts: result.attempts,
          fallbackModelCount: fallbackModels.length,
        }
      );

      return NextResponse.json(
        {
          success: true,
          provider,
          models: fallbackModels,
          fallback: true,
          warning: result.error,
          attempts: result.attempts,
        }
      );
    }

    const availableModels = result.data || [];

    await logAudit('AUDIT', `Available ${provider} models fetched by ${session.user.name}. Found ${availableModels.length} models.`, 'API:AvailableModels:Fetch', session.user.id, {
      provider,
      modelCount: availableModels.length,
    });

    return NextResponse.json({
      success: true,
      provider,
      models: availableModels
    });

  } catch (error) {
    console.error('[AVAILABLE MODELS] Error fetching models:', error);
    await logAudit('ERROR', `Failed to fetch available models. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'API:AvailableModels:Fetch');
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}
