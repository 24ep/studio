import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { employeeForUser } from '@/lib/learning/learning-access';
import { completeBlock, recordHeartbeat, submitAssignment, submitQuiz } from '@/lib/learning/learning-service';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('heartbeat'), enrollmentId: z.string().uuid(), lessonId: z.string().uuid(), seconds: z.number().min(0).max(30), furthestSecond: z.number().min(0).optional() }),
  z.object({ action: z.literal('complete_block'), enrollmentId: z.string().uuid(), lessonId: z.string().uuid(), blockId: z.string().uuid() }),
  z.object({ action: z.literal('submit_quiz'), enrollmentId: z.string().uuid(), blockId: z.string().uuid(), answers: z.record(z.string(), z.string()) }),
  z.object({ action: z.literal('submit_assignment'), enrollmentId: z.string().uuid(), blockId: z.string().uuid(), text: z.string().max(20000).optional(), fileUrl: z.string().max(2000).optional() }),
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid progress update', errors: parsed.error.flatten() }, { status: 400 });
  const employeeId = await employeeForUser(session.user.id, session.user.email);
  if (!employeeId) return NextResponse.json({ message: 'No linked employee' }, { status: 404 });
  try {
    if (parsed.data.action === 'heartbeat') {
      await recordHeartbeat({ ...parsed.data, employeeId });
      return NextResponse.json({ data: { saved: true } });
    }
    if (parsed.data.action === 'complete_block') return NextResponse.json({ data: await completeBlock({ ...parsed.data, employeeId }) });
    if (parsed.data.action === 'submit_quiz') return NextResponse.json({ data: await submitQuiz({ ...parsed.data, employeeId }) });
    return NextResponse.json({ data: await submitAssignment({ ...parsed.data, employeeId }) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to update progress' }, { status: 400 });
  }
}
