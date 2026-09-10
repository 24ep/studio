import prisma from './prisma';
import { readJsonOrFallback } from './response-json';

interface RecruitmentStageNameId {
  id: string;
  name: string;
}

function isRecruitmentStageNameId(value: unknown): value is RecruitmentStageNameId {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

function findStageIdByName(stages: RecruitmentStageNameId[], name: string) {
  return stages.find(stage => stage.name.toLowerCase() === name)?.id;
}

/**
 * Get recruitment stage ID by name (case-insensitive)
 * @server-only This function uses Prisma and should only be called on the server side
 */
export async function getRecruitmentStageByName(name: string): Promise<string | null> {
  try {
    const stage = await prisma.recruitmentStage.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    });
    return stage?.id || null;
  } catch (error) {
    console.error(`Error finding recruitment stage by name '${name}':`, error);
    return null;
  }
}

/**
 * Get recruitment stage name by ID
 * @server-only This function uses Prisma and should only be called on the server side
 */
export async function getRecruitmentStageName(id: string): Promise<string | null> {
  try {
    const stage = await prisma.recruitmentStage.findUnique({
      where: { id },
      select: { name: true }
    });
    return stage?.name || null;
  } catch (error) {
    console.error(`Error finding recruitment stage by ID '${id}':`, error);
    return null;
  }
}

/**
 * Get recruitment stage names by IDs (client-side safe)
 * This function uses the API endpoint and can be called from client components
 */
export async function getRecruitmentStageNamesByIds(ids: string[]): Promise<Record<string, string>> {
  try {
    if (ids.length === 0) return {};

    const response = await fetch(`/api/settings/recruitment-stages?ids=${ids.join(',')}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stage names: ${response.statusText}`);
    }

    const stages = await readJsonOrFallback<unknown>(response, []);
    const nameMap: Record<string, string> = {};
    const validStages = Array.isArray(stages) ? stages.filter(isRecruitmentStageNameId) : [];

    validStages.forEach(stage => {
      nameMap[stage.id] = stage.name;
    });

    return nameMap;
  } catch (error) {
    console.error('Error fetching recruitment stage names:', error);
    return {};
  }
}

/**
 * Get recruitment stage name by ID (client-side safe)
 * This function uses the API endpoint and can be called from client components
 */
export async function getRecruitmentStageNameClient(id: string): Promise<string | null> {
  try {
    const nameMap = await getRecruitmentStageNamesByIds([id]);
    return nameMap[id] || null;
  } catch (error) {
    console.error(`Error finding recruitment stage name by ID '${id}':`, error);
    return null;
  }
}

/**
 * Get all recruitment stages
 */
export async function getAllRecruitmentStages() {
  try {
    return await prisma.recruitmentStage.findMany({
      orderBy: { sortOrder: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching recruitment stages:', error);
    return [];
  }
}

/**
 * Update Applicant status by stage name
 */
export async function updateApplicantStatus(
  applicantId: string,
  stageName: string
): Promise<void> {
  const stage = await getRecruitmentStageByName(stageName);
  if (!stage) {
    throw new Error(`Recruitment stage '${stageName}' not found`);
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { statusId: stage }
  });
}

/**
 * Get common stage IDs for frequently used statuses
 */
export async function getCommonStageIds() {
  const stages = await getAllRecruitmentStages();

  return {
    applied: findStageIdByName(stages, 'applied'),
    screening: findStageIdByName(stages, 'screening'),
    shortlisted: findStageIdByName(stages, 'shortlisted'),
    interviewScheduled: findStageIdByName(stages, 'interview scheduled'),
    interviewing: findStageIdByName(stages, 'interviewing'),
    offerExtended: findStageIdByName(stages, 'offer extended'),
    hired: findStageIdByName(stages, 'hired'),
    onHold: findStageIdByName(stages, 'on hold'),
    rejected: findStageIdByName(stages, 'rejected'),
  };
}

/**
 * Check if an applicant status matches a specific stage name
 */
export function isApplicantInStage(applicantStatus: string, stageName: string, stageIds: Record<string, string | undefined>): boolean {
  const stageId = stageIds[stageName.toLowerCase() as keyof typeof stageIds];
  return stageId ? applicantStatus === stageId : false;
}

/**
 * Get stage name from Applicant status ID
 */
export async function getStageNameFromStatus(statusId: string): Promise<string | null> {
  return await getRecruitmentStageName(statusId);
}
