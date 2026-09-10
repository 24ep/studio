import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireScreeningPermission } from '@/lib/screening/auth';
import { recordScreeningConsent } from '@/lib/screening/service';

const schema = z.object({ subjectType: z.enum(['applicant', 'employee']), subjectId: z.string().uuid(), noticeVersion: z.string().max(80).optional(), captureSource: z.string().min(1).max(80) });

export async function POST(request: NextRequest) {
  const session = await requireScreeningPermission('SCREENING_CREATE');
  if (!session) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid consent record' }, { status: 400 });
  return NextResponse.json({ consentId: await recordScreeningConsent(parsed.data) }, { status: 201 });
}
