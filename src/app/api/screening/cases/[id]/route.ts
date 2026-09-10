import { NextRequest, NextResponse } from 'next/server';
import { getScreeningCase } from '@/lib/screening/service';
import { requireScreeningPermission } from '@/lib/screening/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireScreeningPermission('SCREENING_VIEW');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const { id } = await context.params;
  const screeningCase = await getScreeningCase(id);
  if (!screeningCase) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (!hasPermission(session.user, 'SCREENING_EVIDENCE_VIEW')) {
    screeningCase.findings = Array.isArray(screeningCase.findings) ? screeningCase.findings.map((value: Record<string, unknown>) => ({ ...value, source_url: null, reviewed_excerpt: null, ai_explanation: null })) : [];
  }
  return NextResponse.json({ case: screeningCase });
}
