import { z } from 'zod';
import type { CurriculumSection } from './learning-service';

const textBlockSchema = z.object({
  type: z.literal('text'),
  title: z.string().min(1).max(160),
  content: z.string().min(1),
});

const acknowledgementBlockSchema = z.object({
  type: z.literal('acknowledgement'),
  title: z.string().min(1).max(160),
  statement: z.string().min(1),
});

const quizBlockSchema = z.object({
  type: z.literal('quiz'),
  title: z.string().min(1).max(160),
  questions: z.array(z.object({
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(5),
    correctAnswer: z.string().min(1),
  })).min(1).max(8),
});

const generatedCourseSchema = z.object({
  title: z.string().min(1).max(180),
  category: z.string().min(1).max(120).default('Professional development'),
  description: z.string().min(1).max(2000),
  objectives: z.array(z.string().min(1)).min(2).max(8),
  sections: z.array(z.object({
    title: z.string().min(1).max(180),
    lessons: z.array(z.object({
      title: z.string().min(1).max(180),
      description: z.string().max(1000).default(''),
      estimatedMinutes: z.number().int().min(2).max(120),
      blocks: z.array(z.discriminatedUnion('type', [textBlockSchema, acknowledgementBlockSchema, quizBlockSchema])).min(1).max(8),
    })).min(1).max(10),
  })).min(1).max(8),
});

export const generatedCourseResponseSchema = z.object({ course: generatedCourseSchema });
export const generatedPathResponseSchema = z.object({
  path: z.object({
    title: z.string().min(1).max(180),
    description: z.string().min(1).max(2000),
    courses: z.array(generatedCourseSchema).min(2).max(6),
  }),
});

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>;

export function generatedCourseToCurriculum(course: GeneratedCourse): CurriculumSection[] {
  return course.sections.map(section => ({
    title: section.title,
    lessons: section.lessons.map(lesson => ({
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      minimumActiveSeconds: Math.min(300, Math.max(20, lesson.estimatedMinutes * 20)),
      blocks: lesson.blocks.map(block => {
        if (block.type === 'text') return { type: 'text' as const, title: block.title, required: true, content: { text: block.content } };
        if (block.type === 'acknowledgement') return { type: 'acknowledgement' as const, title: block.title, required: true, content: { description: block.statement, instructions: block.statement } };
        return {
          type: 'quiz' as const,
          title: block.title,
          required: true,
          content: {
            questions: block.questions.map(question => ({ id: crypto.randomUUID(), ...question })),
          },
        };
      }),
    })),
  }));
}

export function estimatedCourseHours(course: GeneratedCourse) {
  const minutes = course.sections.flatMap(section => section.lessons).reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);
  return Math.max(0.25, Math.round((minutes / 60) * 4) / 4);
}
