import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { appraisalMutationSchema } from '@/lib/appraisal/appraisal-contracts';
import {
  getAppraisalWorkspace,
  mutateAppraisalWorkspace,
} from '@/lib/appraisal/appraisal-service';
import { logAudit } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const data = await getAppraisalWorkspace(session.user);
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[Appraisal API] Workspace load failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load Appraisal.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }
  const parsed = appraisalMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Review the highlighted appraisal fields.', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await mutateAppraisalWorkspace(session.user, parsed.data);
    await logAudit(
      'AUDIT',
      `Appraisal action completed: ${parsed.data.action}.`,
      `API:Appraisal:${parsed.data.action}`,
      session.user.id,
      {
        action: parsed.data.action,
        reviewId: 'reviewId' in parsed.data ? parsed.data.reviewId : null,
        cycleId: 'cycleId' in parsed.data ? parsed.data.cycleId : null,
        assignmentId: 'assignmentId' in parsed.data ? parsed.data.assignmentId : null,
      },
      session.user.adminId || null,
    );
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to complete the appraisal action.';
    const conflict = /changed before|already completed|active appeal already exists/i.test(message);
    const forbidden = /outside your authorized|do not have permission|only .* may|not the assigned/i.test(message);
    const notFound = /not been released|No employee record/.test(message);
    return NextResponse.json(
      { message },
      { status: conflict ? 409 : forbidden ? 403 : notFound ? 404 : 400 },
    );
  }
}
