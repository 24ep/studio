import type { NextRequest } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

const expertiseSkillGroupInclude = {
  group: {
    select: {
      id: true,
      name: true,
      color: true
    }
  }
};

const groupIdSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const s = String(val);
    return UUID_REGEX.test(s) ? s : null;
  },
  z.string().uuid().nullable().optional()
);

const optionalTrimmedStringSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const trimmed = typeof val === 'string' ? val.trim() : String(val).trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().min(1, 'Name is required').optional()
);

const optionalDescriptionSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === '') return null;
    return typeof val === 'string' ? val : String(val);
  },
  z.string().nullable().optional()
);

const optionalMaxScoreSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
    return Number.isNaN(num) ? undefined : num;
  },
  z.number().int().min(1, 'Max score must be at least 1').max(1000, 'Max score must be at most 1000').optional()
);

const createExpertiseSkillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  maxScore: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return 100;
      const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
      return Number.isNaN(num) ? 100 : num;
    },
    z.number().int().min(1, 'Max score must be at least 1').max(1000, 'Max score must be at most 1000')
  ),
  skillType: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return 'hard_skill';
      return val;
    },
    z.enum(['hard_skill', 'test_score'])
  ),
  groupId: groupIdSchema
});

const updateExpertiseSkillSchema = z.object({
  name: optionalTrimmedStringSchema,
  description: optionalDescriptionSchema,
  maxScore: optionalMaxScoreSchema,
  skillType: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return val;
    },
    z.enum(['hard_skill', 'test_score']).optional()
  ),
  groupId: groupIdSchema,
  isActive: z.boolean().optional()
});

export type ExpertiseSkillCreateData = z.infer<typeof createExpertiseSkillSchema>;
export type ExpertiseSkillUpdateData = z.infer<typeof updateExpertiseSkillSchema>;

export async function parseCreateExpertiseSkillRequest(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  return createExpertiseSkillSchema.parse(bodyResult.ok ? bodyResult.value : undefined);
}

export async function parseUpdateExpertiseSkillRequest(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  return updateExpertiseSkillSchema.parse(bodyResult.ok ? bodyResult.value : undefined);
}

export function buildExpertiseSkillUpdateData(validatedData: ExpertiseSkillUpdateData) {
  return {
    ...validatedData,
    name: validatedData.name?.trim()
  };
}

export async function listExpertiseSkills() {
  return prisma.expertiseSkill.findMany({
    include: expertiseSkillGroupInclude,
    orderBy: { sortOrder: 'asc' }
  });
}

export async function findExpertiseSkill(id: string) {
  return prisma.expertiseSkill.findUnique({
    where: { id },
    include: expertiseSkillGroupInclude
  });
}

export async function findExpertiseSkillById(id: string) {
  return prisma.expertiseSkill.findUnique({
    where: { id }
  });
}

export async function findExpertiseSkillByName(name: string) {
  return prisma.expertiseSkill.findUnique({
    where: { name }
  });
}

export async function expertiseGroupExists(groupId: string) {
  const group = await prisma.expertiseGroup.findUnique({
    where: { id: groupId },
    select: { id: true }
  });
  return Boolean(group);
}

export async function getNextExpertiseSkillSortOrder() {
  const lastSkill = await prisma.expertiseSkill.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true }
  });

  return (lastSkill?.sortOrder || 0) + 1;
}

export async function createExpertiseSkill(data: ExpertiseSkillCreateData) {
  return prisma.expertiseSkill.create({
    data: {
      ...data,
      sortOrder: await getNextExpertiseSkillSortOrder()
    },
    include: expertiseSkillGroupInclude
  });
}

export async function updateExpertiseSkill(id: string, data: ExpertiseSkillUpdateData) {
  return prisma.expertiseSkill.update({
    where: { id },
    data: buildExpertiseSkillUpdateData(data),
    include: expertiseSkillGroupInclude
  });
}

export async function deleteExpertiseSkill(id: string) {
  return prisma.expertiseSkill.delete({
    where: { id }
  });
}
