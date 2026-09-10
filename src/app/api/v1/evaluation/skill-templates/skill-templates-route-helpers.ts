import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

type SkillTemplateRequestBody = {
  name?: unknown;
  description?: unknown;
  groupIds?: unknown;
  skillIds?: unknown;
  personalityGroupIds?: unknown;
  personalityTraitIds?: unknown;
};

export type NormalizedSkillTemplateInput = {
  description: string | null;
  name: string;
  validGroupIds: string[];
  validPersonalityGroupIds: string[];
  validPersonalityTraitIds: string[];
  validSkillIds: string[];
};

export const skillTemplateInclude = {
  templateGroups: {
    include: {
      group: true,
    },
  },
  templateSkills: {
    include: {
      skill: true,
    },
  },
  templatePersonalityGroups: {
    include: {
      group: true,
    },
  },
  templatePersonalityTraits: {
    include: {
      trait: true,
    },
  },
} satisfies Prisma.SkillTemplateInclude;

function getStringIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((id): id is string => typeof id === "string" && id.trim() !== "");
}

export function normalizeSkillTemplateRequest(body: SkillTemplateRequestBody) {
  const {
    name,
    description,
    groupIds = [],
    skillIds = [],
    personalityGroupIds = [],
    personalityTraitIds = [],
  } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return {
      response: NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      ),
    };
  }

  return {
    input: {
      name: name.trim(),
      description: typeof description === "string" ? description : null,
      validGroupIds: getStringIdArray(groupIds),
      validSkillIds: getStringIdArray(skillIds),
      validPersonalityGroupIds: getStringIdArray(personalityGroupIds),
      validPersonalityTraitIds: getStringIdArray(personalityTraitIds),
    },
  };
}

async function validateExistingIds(
  label: string,
  ids: string[],
  findExistingIds: (ids: string[]) => Promise<Array<{ id: string }>>,
) {
  if (ids.length === 0) {
    return null;
  }

  const existingIds = new Set((await findExistingIds(ids)).map(({ id }) => id));
  const invalidIds = ids.filter((id) => !existingIds.has(id));

  if (invalidIds.length === 0) {
    return null;
  }

  return NextResponse.json(
    { error: `Invalid ${label}: ${invalidIds.join(", ")}` },
    { status: 400 },
  );
}

export async function validateSkillTemplateReferences(input: NormalizedSkillTemplateInput) {
  const invalidGroupResponse = await validateExistingIds(
    "expertise group IDs",
    input.validGroupIds,
    (ids) => prisma.expertiseGroup.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    }),
  );
  if (invalidGroupResponse) return invalidGroupResponse;

  const invalidSkillResponse = await validateExistingIds(
    "expertise skill IDs",
    input.validSkillIds,
    (ids) => prisma.expertiseSkill.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    }),
  );
  if (invalidSkillResponse) return invalidSkillResponse;

  const invalidPersonalityGroupResponse = await validateExistingIds(
    "personality group IDs",
    input.validPersonalityGroupIds,
    (ids) => prisma.personalityGroup.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    }),
  );
  if (invalidPersonalityGroupResponse) return invalidPersonalityGroupResponse;

  return validateExistingIds(
    "personality trait IDs",
    input.validPersonalityTraitIds,
    (ids) => prisma.personalityTrait.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    }),
  );
}

export function buildSkillTemplateCreateData(input: NormalizedSkillTemplateInput) {
  return {
    name: input.name,
    description: input.description,
    templateGroups: input.validGroupIds.length > 0 ? {
      create: input.validGroupIds.map((groupId) => ({
        groupId,
      })),
    } : undefined,
    templateSkills: input.validSkillIds.length > 0 ? {
      create: input.validSkillIds.map((skillId) => ({
        skillId,
      })),
    } : undefined,
    templatePersonalityGroups: input.validPersonalityGroupIds.length > 0 ? {
      create: input.validPersonalityGroupIds.map((groupId) => ({
        groupId,
      })),
    } : undefined,
    templatePersonalityTraits: input.validPersonalityTraitIds.length > 0 ? {
      create: input.validPersonalityTraitIds.map((traitId) => ({
        traitId,
      })),
    } : undefined,
  };
}

export function getSkillTemplateErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getSkillTemplateErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const { code } = error as { code?: unknown };
  return typeof code === "string" ? code : undefined;
}

export function getSkillTemplateErrorStatus(error: unknown): number {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return 500;
  }

  const { status } = error as { status?: unknown };
  return typeof status === "number" ? status : 500;
}
