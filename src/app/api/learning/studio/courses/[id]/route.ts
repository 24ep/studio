import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import { getCourseDetail } from '@/lib/learning/learning-service';
import { saveCourseCurriculumRevision } from '@/lib/learning/learning-course-authoring';

const block = z.object({ type: z.enum(['text','video','attachment','acknowledgement','break','quiz','assignment']), title: z.string().optional(), required: z.boolean().optional(), content: z.record(z.string(), z.unknown()) });
const payload = z.object({
  publish: z.boolean().default(false),
  rules: z.object({ passingScore: z.number().min(0).max(100), maxAttempts: z.number().int().min(1).max(20), requiredWatchPercent: z.number().min(1).max(100) }).partial().default({}),
  sections: z.array(z.object({ title: z.string().min(1), lessons: z.array(z.object({ title: z.string().min(1), description: z.string().optional(), estimatedMinutes: z.number().int().min(1).optional(), minimumActiveSeconds: z.number().int().min(0).optional(), blocks: z.array(block) })) })).min(1),
});

function canManage(user: Parameters<typeof hasAnyPermission>[0]) {
  return hasAnyPermission(user, ['HR_LEARNING_MANAGE']);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const detail = await getCourseDetail((await params).id, null, true);
  return detail ? NextResponse.json({ data: detail }) : NextResponse.json({ message: 'Course not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!canManage(session.user)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid curriculum', errors: parsed.error.flatten() }, { status: 400 });
  try {
    const data = await saveCourseCurriculumRevision((await params).id, parsed.data.sections, parsed.data.rules, session.user.id, parsed.data.publish);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to save curriculum' }, { status: 400 });
  }
}
