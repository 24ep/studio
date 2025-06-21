// src/app/api/ai/search-candidates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { searchCandidatesAIChat } from '@/ai/flows/search-candidates-flow';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';

const searchRequestSchema = z.object({
  query: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = searchRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { query } = validation.data;
    const result = await searchCandidatesAIChat({ query });

    await logAudit('AUDIT', `User performed an AI search. Query: "${query}"`, 'AI Search', session.user.id, { query });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI search failed:", error);
    await logAudit('ERROR', 'An error occurred during AI search.', 'AI Search', session.user.id, { error: error.message });
    return NextResponse.json({ error: 'An error occurred during the AI search.', details: error.message }, { status: 500 });
  }
}
