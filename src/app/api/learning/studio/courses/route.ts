import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import { createCourseWithCurriculum } from '@/lib/learning/learning-course-authoring';

const block = z.object({
  type: z.enum(['text','video','attachment','acknowledgement','break','quiz','assignment']),
  title: z.string().optional(),
  required: z.boolean().optional(),
  content: z.record(z.string(), z.unknown()),
});

const payload = z.object({
  metadata: z.object({
    title: z.string().trim().min(1).max(300),
    category: z.string().trim().max(120).nullable().optional(),
    description: z.string().max(10000).nullable().optional(),
    durationHours: z.number().min(0).max(1000).nullable().optional(),
    isRequired: z.boolean().optional(),
    coverImageUrl: z.string().max(2000).nullable().optional(),
    objectives: z.array(z.string().max(500)).max(30).optional(),
  }),
  publish: z.boolean().default(false),
  rules: z.object({
    passingScore: z.number().min(0).max(100).optional(),
    maxAttempts: z.number().int().min(1).max(20).optional(),
    requiredWatchPercent: z.number().min(1).max(100).optional(),
  }).default({}),
  sections: z.array(z.object({
    title: z.string().trim().min(1),
    lessons: z.array(z.object({
      title: z.string().trim().min(1),
      description: z.string().optional(),
      estimatedMinutes: z.number().int().min(1).optional(),
      minimumActiveSeconds: z.number().int().min(0).optional(),
      blocks: z.array(block),
    })).min(1),
  })).min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasAnyPermission(session.user, ['HR_LEARNING_MANAGE'])) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid course draft', errors: parsed.error.flatten() }, { status: 400 });

  try {
    const data = await createCourseWithCurriculum({
      ...parsed.data,
      metadata: { ...parsed.data.metadata, ownerName: session.user.name ?? 'Learning team' },
    }, session.user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to create course' }, { status: 400 });
  }
}
