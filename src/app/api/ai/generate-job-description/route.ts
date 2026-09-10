import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to use AI features
  // Users should be able to use AI features if they can manage positions or have AI-specific permissions
  if (!hasPermission(session.user, 'POSITIONS_EDIT_BASIC') && 
      !hasPermission(session.user, 'AI_INTEGRATION_VIEW')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to use AI features' }, { status: 403 });
  }

  try {
    const body = await readRequestJsonObject(request);
    const title = getJsonString(body, 'title');
    const department = getJsonString(body, 'department');
    const positionLevel = getJsonString(body, 'positionLevel');
    const existingDescription = getJsonString(body, 'existingDescription');

    if (!title || !department) {
      return NextResponse.json(
        { error: 'Title and department are required' },
        { status: 400 }
      );
    }



    // Get the system prompt from settings
    const { getSystemSetting } = await import('@/lib/systemSettings');
    const systemPromptTemplate = await getSystemSetting('jobDescriptionSystemPrompt');

    let prompt = '';

    if (systemPromptTemplate) {
      // Use configured prompt and replace variables
      prompt = systemPromptTemplate
        .replace(/\$\{title\}/g, title)
        .replace(/\$\{department\}/g, department)
        .replace(/\$\{positionLevel\}/g, positionLevel || 'professional');
    } else {
      // Fallback to default prompt
      prompt = `Generate a professional job description for a ${positionLevel || 'professional'} ${title} position in the ${department} department.

Please include:
1. Job Summary
2. Key Responsibilities (5-8 bullet points)
3. Required Qualifications
4. Preferred Qualifications
5. Key Competencies

Format the response in HTML with h2 and h3 headings and bullet points (ul, li). Make it professional and comprehensive.

Return ONLY the HTML-formatted job description without any additional text or explanations.`;
    }

    if (existingDescription && String(existingDescription).trim()) {
      prompt += `\n\nExisting job description to consider and improve:\n${String(existingDescription).trim()}\n\nUse the existing job description as additional context. Preserve strong relevant details, improve structure and clarity, and produce an updated complete job description rather than ignoring the existing content.`;
    }

    const result = await executeWithApiKeyFallback(
      async (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, prompt),
      'Generate Job Description'
    );

    if (!result.success) {
      console.error('AI Job Description: All API keys failed');
      return NextResponse.json(
        { 
          error: `AI features are not available because all configured ${getProviderLabel(result.provider)} keys failed. Please check your AI provider configuration.`,
          attempts: result.attempts,
          lastError: result.error
        },
        { status: 503 }
      );
    }

    let generatedDescription = result.data || '';

    // Clean up the response - remove markdown code blocks if present
    generatedDescription = generatedDescription
      .replace(/```html\s*/gi, '')  // Remove opening ```html
      .replace(/```\s*$/gi, '')     // Remove closing ```
      .trim();

    // Log the AI generation activity
    await logAudit(
      'AUDIT',
      `AI job description generated for position: ${title} in ${department}`,
      'API:AI:GenerateJobDescription',
      session.user.id,
      { title, department, positionLevel }
    );

    return NextResponse.json({
      description: generatedDescription,
      success: true
    });

  } catch (error) {
    console.error('Error generating job description:', error);
    await logAudit(
      'ERROR',
      `Failed to generate job description: ${(error as Error).message}`,
      'API:AI:GenerateJobDescription',
      session.user?.id
    );
    
    return NextResponse.json(
      { error: `Failed to generate job description: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 
