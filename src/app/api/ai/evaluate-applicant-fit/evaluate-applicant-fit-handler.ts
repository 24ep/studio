import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getSystemSetting } from '@/lib/systemSettings';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  buildFitEvaluationContext,
  fetchApplicantForFitEvaluation,
  fetchPositionForFitEvaluation,
  getEvaluateFitClient,
} from './evaluate-applicant-fit-data';
import { buildEvaluationPrompt } from './evaluate-applicant-fit-prompt';
import { normalizeEvaluationResult, parseJsonResponse } from './evaluate-applicant-fit-result';
import {
  DEFAULT_EVALUATION_PROMPT,
  evaluateApplicantFitSchema,
} from './evaluate-applicant-fit-schema';
import {
  saveFitEvaluation,
  validateSaveFitEvaluationAccess,
} from './evaluate-applicant-fit-save';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

export async function handleEvaluateApplicantFit(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validation = evaluateApplicantFitSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const { applicantId, save, promptOverride } = validation.data;
  let { positionId } = validation.data;
  const client = await getEvaluateFitClient();

  try {
    const applicant = await fetchApplicantForFitEvaluation(client, applicantId);
    if (!applicant) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    positionId = positionId || applicant.positionId || undefined;
    if (!positionId) {
      return NextResponse.json(
        { message: 'A positionId is required because the applicant has no applied position.' },
        { status: 400 }
      );
    }

    const position = await fetchPositionForFitEvaluation(client, positionId);
    if (!position) {
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    const configuredPrompt = promptOverride
      || await getSystemSetting('applicantEvaluationCriteriaPrompt')
      || DEFAULT_EVALUATION_PROMPT;
    const context = await buildFitEvaluationContext(client, applicant, position);
    const prompt = buildEvaluationPrompt(configuredPrompt, context);
    const aiResult = await executeWithApiKeyFallback(
      async (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, prompt, {
        temperature: 0.2,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 2048,
      }),
      'Applicant Fit Evaluation'
    );

    if (!aiResult.success) {
      return NextResponse.json({
        success: false,
        unavailable: true,
        message: `AI features are not available because all configured ${getProviderLabel(aiResult.provider)} keys failed. Please check your AI provider configuration.`,
        error: 'API_KEY_FAILURE',
        attempts: aiResult.attempts,
        lastError: aiResult.error,
      });
    }

    const evaluation = normalizeEvaluationResult(parseJsonResponse(aiResult.data || ''));

    if (save) {
      const accessError = validateSaveFitEvaluationAccess(session.user, applicant.recruiterId ?? null);
      if (accessError) {
        return accessError;
      }

      await saveFitEvaluation({
        client,
        applicant,
        applicantId,
        positionId,
        evaluation,
      });
    }

    await logAudit(
      'AUDIT',
      `AI applicant fit evaluation generated for ${applicant.name}${save ? ' and saved' : ''}.`,
      'API:AI:EvaluateApplicantFit',
      session.user.id,
      { applicantId, positionId, fitScore: evaluation.fitScore, saved: save }
    );

    return NextResponse.json({
      success: true,
      saved: save,
      applicantId,
      positionId,
      evaluation,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors when no transaction was opened.
    }

    console.error('Error evaluating applicant fit:', error);
    const errorMessage = getErrorMessage(error);
    await logAudit(
      'ERROR',
      `Failed to evaluate applicant fit: ${errorMessage}`,
      'API:AI:EvaluateApplicantFit',
      session.user?.id
    );
    return NextResponse.json(
      { message: `Failed to evaluate applicant fit: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
