export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/ai/search-Applicants/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { searchApplicantsAIChat } from '@/ai/flows/search-applicants-flow';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

const searchRequestSchema = z.object({
  query: z.string(),
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error occurred';
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check if user has permission to use AI search
  // Users should be able to use AI search if they can view Applicants or have AI-specific permissions
  if (!hasPermission(session.user, 'applicantS_VIEW') && 
      !hasPermission(session.user, 'AI_INTEGRATION_VIEW')) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to use AI search" }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const body = bodyResult.ok ? bodyResult.value : undefined;
    const validation = searchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        message: 'Invalid request body', 
        error: 'Invalid request body', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const validatedData = validation.data;
    const query = validatedData.query;
    const result = await searchApplicantsAIChat({ query });

    // Log audit asynchronously to avoid blocking the response
    logAudit('AUDIT', `User performed an AI search. Query: "${query}"`, 'AI Search', session.user.id, { query })
      .catch(err => console.error('Failed to log audit for AI search:', err));

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI search failed:", error);
    const errorMessage = getErrorMessage(error);
    const errorStack = getErrorStack(error);
    const errorDetails = errorStack || errorMessage;
    
    // Log audit asynchronously to avoid blocking the error response
    logAudit('ERROR', 'An error occurred during AI search.', 'AI Search', session.user.id, { 
      error: errorMessage,
      stack: errorStack
    }).catch(err => console.error('Failed to log audit for AI search error:', err));
    
    return NextResponse.json({ 
      message: `AI search failed: ${errorMessage}`,
      error: 'An error occurred during the AI search.', 
      details: errorDetails 
    }, { status: 500 });
  }
}

