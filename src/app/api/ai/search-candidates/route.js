// src/app/api/ai/search-candidates/route.ts
import { NextResponse } from 'next/server';
import { searchCandidatesAIChat } from '@/ai/flows/search-candidates-flow';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
const searchRequestSchema = z.object({
    query: z.string(),
});
export const dynamic = "force-dynamic";
export async function POST(request) {
    var _a;
    const session = await getServerSession(authOptions);
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
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
    }
    catch (error) {
        console.error("AI search failed:", error);
        await logAudit('ERROR', 'An error occurred during AI search.', 'AI Search', session.user.id, { error: error.message });
        return NextResponse.json({ error: 'An error occurred during the AI search.', details: error.message }, { status: 500 });
    }
}
