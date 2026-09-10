import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { readRequestJsonResult } from '@/lib/request-json';
import { buildApplicantContext, buildDetailedGenerateContentPrompt, cleanGeneratedHtml } from './generate-content-context';
import { getGenerateContentApplicantData } from './generate-content-data';
import { generateContentSchema } from './generate-content-schema';

async function parseRequestJson(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  return { ok: true as const, body: result.value };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function handleGenerateContentPost(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson.response;
  }

  const validationResult = generateContentSchema.safeParse(parsedJson.body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Validation failed', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const { applicantId, systemPrompt, promptName, promptCategory } = validationResult.data;

  try {
    const applicantData = await getGenerateContentApplicantData(applicantId);
    const applicantContext = buildApplicantContext(applicantData);
    const detailedContext = buildDetailedGenerateContentPrompt(applicantContext, systemPrompt);

    const result = await executeWithApiKeyFallback(
      async (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, detailedContext, {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }),
      'Generate Content'
    );

    if (!result.success) {
      console.error('Generative AI: All API keys failed');
      return NextResponse.json({
        success: false,
        unavailable: true,
        content: '',
        message: `AI features are not available because all configured ${getProviderLabel(result.provider)} keys failed. Please check your AI provider configuration.`,
        error: 'API_KEY_FAILURE',
        attempts: result.attempts,
        lastError: result.error,
      });
    }

    const generatedContent = cleanGeneratedHtml(result.data || '');
    const applicantName = applicantData.applicant.name;

    await logAudit(
      'AUDIT',
      `AI content generated using prompt: ${promptName} (${promptCategory}) for applicant: ${applicantName}`,
      'API:AI:GenerateContent',
      session.user.id,
      { applicantId, applicantName, promptName, promptCategory }
    );

    return NextResponse.json({
      success: true,
      content: generatedContent,
      promptUsed: promptName,
      category: promptCategory,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Error generating content:', error);
    await logAudit('ERROR', `Failed to generate AI content: ${message}`, 'API:AI:GenerateContent', session.user?.id);

    return NextResponse.json({ message: `Failed to generate content: ${message}` }, { status: 500 });
  }
}
