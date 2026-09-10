export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';

import { auth } from '@/auth';
import { fetchAppKitSeedCollection } from '@/lib/appkit-sdk-client';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';
import { readRequestJsonResult } from '@/lib/request-json';

const appKitSystemPromptsImportSchema = z.object({
  environment: z.enum(['development', 'production']).default('production'),
});

type CommonPromptSeed = {
  name: string;
  description: string;
  category: string;
  categoryDescription: string;
  categoryColor: string;
  content: string;
  isActive: boolean;
};

const productionCommonPrompts: CommonPromptSeed[] = [
  {
    name: 'Candidate Summary Brief',
    description: 'Summarize a candidate profile for recruiters and hiring managers.',
    category: 'Applicant Communication',
    categoryDescription: 'Prompts for candidate-facing and internal applicant communication.',
    categoryColor: '#2563EB',
    content: 'Create a concise candidate summary using the available applicant profile, resume evidence, job context, and hiring stage. Highlight strengths, risks, missing information, and recommended next action. Keep the tone factual, fair, and suitable for internal hiring stakeholders.',
    isActive: true,
  },
  {
    name: 'Hiring Manager Interview Guide',
    description: 'Generate interview questions and scorecard guidance.',
    category: 'Interview',
    categoryDescription: 'Prompts for interview planning, question generation, and evaluation guides.',
    categoryColor: '#7C3AED',
    content: 'Generate an interview guide for the selected position and candidate. Include competency areas, behavioral questions, technical or role-specific questions, suggested follow-ups, and a simple scorecard. Ground every question in the job requirements and candidate evidence.',
    isActive: true,
  },
  {
    name: 'Candidate Outreach Email',
    description: 'Draft candidate-facing outreach email.',
    category: 'Communication',
    categoryDescription: 'Prompts for emails, messages, and stakeholder updates.',
    categoryColor: '#059669',
    content: 'Draft a candidate-facing email that is clear, warm, and professional. Use the applicant status, position, recruiter context, and next step details when provided. Avoid unsupported claims and keep placeholders for missing dates, times, or links.',
    isActive: true,
  },
  {
    name: 'Position Intake Checklist',
    description: 'Generate a structured intake checklist for a new or open role.',
    category: 'Recruitment Planning',
    categoryDescription: 'Prompts for requisition planning, role intake, and recruiting workflow setup.',
    categoryColor: '#D97706',
    content: 'Create a role intake checklist for recruiters and hiring managers. Include must-have requirements, preferred qualifications, screening criteria, compensation or location constraints, interview plan, approval gaps, and open questions to resolve before sourcing.',
    isActive: true,
  },
];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const input = appKitSystemPromptsImportSchema.parse(bodyResult.ok ? bodyResult.value : {});
    const prompts = await getPromptSeeds(input.environment);
    const imported = [];

    for (const prompt of prompts) {
      const category = await prisma.systemPromptCategory.upsert({
        where: { name: prompt.category },
        update: {
          description: prompt.categoryDescription,
          color: prompt.categoryColor,
          isActive: true,
        },
        create: {
          name: prompt.category,
          description: prompt.categoryDescription,
          color: prompt.categoryColor,
          isActive: true,
        },
      });
      const existingPrompt = await prisma.systemPrompt.findFirst({
        where: { name: prompt.name },
      });
      const savedPrompt = existingPrompt
        ? await prisma.systemPrompt.update({
          where: { id: existingPrompt.id },
          data: {
            description: prompt.description,
            content: prompt.content,
            categoryId: category.id,
            isActive: prompt.isActive,
          },
        })
        : await prisma.systemPrompt.create({
          data: {
            name: prompt.name,
            description: prompt.description,
            content: prompt.content,
            categoryId: category.id,
            isActive: prompt.isActive,
          },
        });

      imported.push(savedPrompt);
    }

    return NextResponse.json({ prompts: imported }, { status: 200 });
  } catch (error) {
    console.error('Failed to import system prompts from AppKit:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({
      message: 'Error importing system prompts from AppKit',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

async function getPromptSeeds(environment: 'development' | 'production') {
  const appKitPrompts = await fetchAppKitSeedCollection<CommonPromptSeed>(environment, 'ai_prompt_settings');
  const prompts = appKitPrompts.length > 0 ? appKitPrompts : productionCommonPrompts;

  return prompts
    .map(normalizePromptSeed)
    .filter((item) => item.name && item.content && !item.name.toLowerCase().includes('ai power search'));
}

function normalizePromptSeed(item: CommonPromptSeed): CommonPromptSeed {
  return {
    name: String(item.name || '').trim(),
    description: String(item.description || ''),
    category: String(item.category || 'General').trim(),
    categoryDescription: String(item.categoryDescription || 'Common AI prompts for the platform.'),
    categoryColor: String(item.categoryColor || '#3B82F6'),
    content: String(item.content || '').trim(),
    isActive: item.isActive !== false,
  };
}
