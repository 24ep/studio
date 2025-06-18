
// src/app/api/ai/search-candidates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { searchCandidatesAIChat, type SearchCandidatesInput } from '@/ai/flows/search-candidates-flow';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logAudit } from '@/lib/auditLog';

const searchApiSchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters."),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized: User session required." }, { status: 401 });
  }
  // Optional: Add permission check here if only certain roles can use AI search.
  // e.g., if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_AI_SEARCH')) ...

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Invalid JSON in request body.", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = searchApiSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input.", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { query } = validationResult.data;

  try {
    const flowInput: SearchCandidatesInput = { query };
    const result = await searchCandidatesAIChat(flowInput);

    await logAudit(
        'AUDIT',
        `User ${session.user.name} (ID: ${session.user.id}) performed AI candidate search with query: "${query}". Found ${result.matchedCandidateIds.length} candidates.`,
        'AI:CandidateSearch',
        session.user.id,
        { query, matchCount: result.matchedCandidateIds.length, reasoning: result.aiReasoning }
    );

    if (result.aiReasoning?.startsWith('AI features are not available')) {
        // Specific handling for API key not configured, return a user-friendly error
        return NextResponse.json({ message: result.aiReasoning, matchedCandidateIds: [], aiReasoning: result.aiReasoning }, { status: 503 }); // Service Unavailable
    }


    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Error in AI candidate search API route:", error);
    await logAudit(
        'ERROR',
        `AI candidate search failed for user ${session.user.name} (ID: ${session.user.id}) with query: "${query}". Error: ${(error as Error).message}`,
        'AI:CandidateSearch',
        session.user.id,
        { query, error: (error as Error).message }
    );
    return NextResponse.json({ message: "AI search encountered an error.", error: (error as Error).message }, { status: 500 });
  }
}
