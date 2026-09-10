import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireScreeningPermission } from '@/lib/screening/auth';
import { reviewScreeningFinding } from '@/lib/screening/service';

const schema = z.object({
  reviewStatus: z.enum(['confirmed', 'wrong_person', 'irrelevant', 'disputed', 'unverified']),
  reviewedExcerpt: z.string().max(1500).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireScreeningPermission('SCREENING_REVIEW');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid review' }, { status: 400 });
  const { id } = await context.params;
  try { return NextResponse.json({ finding: await reviewScreeningFinding(id, session.user.id, parsed.data) }); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to review finding' }, { status: 400 }); }
}
