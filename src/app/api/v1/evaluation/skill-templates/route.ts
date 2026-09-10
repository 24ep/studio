import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { isJsonObject } from '@/lib/json-types';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  buildSkillTemplateCreateData,
  getSkillTemplateErrorCode,
  getSkillTemplateErrorMessage,
  getSkillTemplateErrorStatus,
  normalizeSkillTemplateRequest,
  skillTemplateInclude,
  validateSkillTemplateReferences,
} from './skill-templates-route-helpers';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/v1/evaluation/skill-templates - Get all skill templates
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeEvaluationConfigurationFromAppKit();
    const templates = await prisma.skillTemplate.findMany({
      include: skillTemplateInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching skill templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill templates' },
      { status: 500 }
    );
  }
}

// POST /api/v1/evaluation/skill-templates - Create new skill template
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const requestData = normalizeSkillTemplateRequest(isJsonObject(bodyResult.value) ? bodyResult.value : {});
    if (requestData.response) {
      return requestData.response;
    }

    const invalidReferenceResponse = await validateSkillTemplateReferences(requestData.input);
    if (invalidReferenceResponse) {
      return invalidReferenceResponse;
    }

    const template = await prisma.skillTemplate.create({
      data: buildSkillTemplateCreateData(requestData.input),
      include: skillTemplateInclude
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating skill template:', error);

    const errorCode = getSkillTemplateErrorCode(error);
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 400 }
      );
    }

    if (errorCode === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference: One or more referenced IDs do not exist' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: getSkillTemplateErrorMessage(error, 'Failed to create skill template') },
      { status: getSkillTemplateErrorStatus(error) }
    );
  }
}
