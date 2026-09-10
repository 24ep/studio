import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enqueueScreeningCase, listScreeningCases } from '@/lib/screening/service';
import { getScreeningSettings } from '@/lib/screening/settings';
import { requireScreeningPermission } from '@/lib/screening/auth';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  subjectType: z.enum(['applicant', 'employee']),
  subjectId: z.string().uuid(),
  useAi: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const session = await requireScreeningPermission('SCREENING_CREATE');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid screening request', issues: parsed.error.flatten() }, { status: 400 });
  try {
    const screeningCase = await enqueueScreeningCase({ ...parsed.data, requestedById: session.user.id, triggerType: 'manual' });
    return NextResponse.json({ case: screeningCase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to queue screening' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const session = await requireScreeningPermission('SCREENING_VIEW');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const subjectType = request.nextUrl.searchParams.get('subjectType');
  const subjectId = request.nextUrl.searchParams.get('subjectId') || undefined;
  const status = request.nextUrl.searchParams.get('status') || undefined;
  if (subjectType && subjectType !== 'applicant' && subjectType !== 'employee') return NextResponse.json({ message: 'Invalid subject type' }, { status: 400 });
  const normalizedSubjectType = subjectType === 'applicant' || subjectType === 'employee' ? subjectType : undefined;
  const [cases, settings] = await Promise.all([listScreeningCases({ subjectType: normalizedSubjectType, subjectId, status }), getScreeningSettings()]);
  const canViewEvidence = hasPermission(session.user, 'SCREENING_EVIDENCE_VIEW');
  return NextResponse.json({ cases: canViewEvidence ? cases : stripEvidence(cases), settings });
}

function stripEvidence(cases: Array<Record<string, unknown>>) {
  return cases.map(item => ({ ...item, findings: Array.isArray(item.findings) ? item.findings.map(value => {
    const finding = value as Record<string, unknown>;
    return { ...finding, source_url: null, reviewed_excerpt: null, ai_explanation: null };
  }) : [] }));
}
