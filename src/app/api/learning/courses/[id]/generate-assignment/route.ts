import { NextResponse, type NextRequest } from 'next/server';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { executeWithApiKeyFallback } from '@/lib/aiApiKeyManager';
import { generateTextWithProvider, getProviderLabel } from '@/lib/aiProvider';
import { getCourseDetail, saveCurriculum, type CurriculumSection } from '@/lib/learning/learning-service';
import { hasAnyPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const requestSchema = z.object({
  lessonId: z.string().uuid(),
  goal: z.string().max(1000).default('Apply the most important skills from this course in a realistic workplace scenario.'),
  submissionType: z.enum(['written', 'file', 'either']).default('either'),
  difficulty: z.enum(['guided', 'independent', 'stretch']).default('independent'),
});

const assignmentSchema = z.object({
  title: z.string().min(1).max(180),
  scenario: z.string().min(1).max(3000),
  instructions: z.array(z.string().min(1)).min(2).max(10),
  deliverable: z.string().min(1).max(1500),
  estimatedMinutes: z.number().int().min(5).max(240),
  rubric: z.array(z.object({
    criterion: z.string().min(1).max(160),
    description: z.string().min(1).max(800),
    weight: z.number().int().min(5).max(100),
  })).min(2).max(6),
});

type Row = Record<string, unknown>;

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
}

function curriculumFromDetail(detail: Awaited<ReturnType<typeof getCourseDetail>>): CurriculumSection[] {
  if (!detail) return [];
  return detail.sections.map(section => ({
    title: String(section.title || 'Section'),
    lessons: section.lessons.map(lesson => ({
      id: String(lesson.id),
      title: String(lesson.title || 'Lesson'),
      description: lesson.description ? String(lesson.description) : undefined,
      estimatedMinutes: Number(lesson.estimated_minutes || 5),
      minimumActiveSeconds: Number(lesson.minimum_active_seconds || 0),
      blocks: lesson.blocks.map(block => ({
        id: String(block.id),
        type: block.type as CurriculumSection['lessons'][number]['blocks'][number]['type'],
        title: block.title ? String(block.title) : undefined,
        required: block.required !== false,
        content: (block.content && typeof block.content === 'object' ? block.content : {}) as Record<string, unknown>,
      })),
    })),
  }));
}

function courseContext(detail: NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>) {
  const parts = [
    `Course: ${String(detail.course.title || '')}`,
    `Description: ${String(detail.course.description || '')}`,
    ...detail.sections.flatMap(section => [
      `Section: ${String(section.title || '')}`,
      ...section.lessons.flatMap(lesson => [
        `Lesson: ${String(lesson.title || '')}\n${String(lesson.description || '')}`,
        ...lesson.blocks.map(block => {
          const content = (block.content || {}) as Row;
          return `Block (${String(block.type)}): ${String(block.title || '')}\n${String(content.text || content.instructions || content.description || '')}`;
        }),
      ]),
    ]),
  ];
  return parts.join('\n\n').slice(0, 60_000);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!hasAnyPermission(session.user, ['HR_LEARNING_MANAGE'])) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Choose a lesson and valid assignment options.' }, { status: 400 });

  try {
    const courseId = (await params).id;
    const detail = await getCourseDetail(courseId, null, true);
    if (!detail) return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    const curriculum = curriculumFromDetail(detail);
    const targetLesson = curriculum.flatMap(section => section.lessons).find(lesson => lesson.id === parsed.data.lessonId);
    if (!targetLesson) return NextResponse.json({ message: 'The selected lesson is no longer available.' }, { status: 400 });

    const prompt = `You are an expert workplace instructional designer. Create one practical assignment based only on the course material below.

Assignment goal: ${parsed.data.goal}
Learner independence: ${parsed.data.difficulty}
Submission type: ${parsed.data.submissionType}
Target lesson: ${targetLesson.title}

The task must assess application, not recall. Make it realistic for employees, achievable without hidden information, and specific enough for consistent HR review. Rubric weights must total exactly 100. Do not invent company policies absent from the course.

Return only valid JSON in this exact shape:
{"title":"...","scenario":"...","instructions":["..."],"deliverable":"...","estimatedMinutes":45,"rubric":[{"criterion":"...","description":"...","weight":40},{"criterion":"...","description":"...","weight":60}]}

COURSE MATERIAL:
${courseContext(detail)}`;

    const aiResult = await executeWithApiKeyFallback(
      (apiKey, model, provider) => generateTextWithProvider(provider, apiKey, model, prompt, { temperature: 0.25, maxOutputTokens: 5000 }),
      'Generate course assignment',
    );
    if (!aiResult.success || !aiResult.data) {
      return NextResponse.json({ message: `AI generation is unavailable because the configured ${getProviderLabel(aiResult.provider)} keys failed.` }, { status: 503 });
    }

    const assignment = assignmentSchema.parse(JSON.parse(jsonrepair(stripCodeFence(aiResult.data))));
    const totalWeight = assignment.rubric.reduce((sum, item) => sum + item.weight, 0);
    const normalizedRubric = assignment.rubric.map((item, index, values) => ({
      ...item,
      weight: index === values.length - 1
        ? 100 - values.slice(0, -1).reduce((sum, value) => sum + Math.round(value.weight / totalWeight * 100), 0)
        : Math.round(item.weight / totalWeight * 100),
    }));
    const instructions = [
      assignment.scenario,
      '',
      'What to do',
      ...assignment.instructions.map((item, index) => `${index + 1}. ${item}`),
      '',
      `Deliverable: ${assignment.deliverable}`,
      '',
      `Estimated time: ${assignment.estimatedMinutes} minutes`,
    ].join('\n');

    targetLesson.blocks.push({
      type: 'assignment',
      title: assignment.title,
      required: true,
      content: {
        instructions,
        deliverable: assignment.deliverable,
        estimatedMinutes: assignment.estimatedMinutes,
        submissionType: parsed.data.submissionType,
        rubric: normalizedRubric,
        generatedByAi: true,
      },
    });
    const data = await saveCurriculum(courseId, curriculum, detail.rules, session.user.id, false);
    await logAudit('AUDIT', `AI assignment generated for course: ${String(detail.course.title || courseId)}`, 'API:Learning:GenerateAssignment', session.user.id, { courseId, lessonId: parsed.data.lessonId, assignmentTitle: assignment.title });
    return NextResponse.json({ data: { ...data, assignment: { ...assignment, rubric: normalizedRubric }, lessonTitle: targetLesson.title } });
  } catch (error) {
    console.error('Unable to generate course assignment:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to generate assignment.' }, { status: 400 });
  }
}
