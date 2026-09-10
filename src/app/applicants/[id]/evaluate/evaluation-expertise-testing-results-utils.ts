import type { TestingResult } from './types';

interface ExpertiseSkillLike {
  id?: string | null;
  name?: string | null;
  maxScore?: number | null;
  isActive?: boolean | null;
}

interface ExpertiseSkillAssignmentLike {
  id?: string | null;
  skill?: ExpertiseSkillLike | null;
}

interface ExpertiseGroupAssignmentLike {
  id?: string | null;
  group?: {
    name?: string | null;
    skills?: ExpertiseSkillLike[] | null;
  } | null;
}

export interface ExpertiseEvaluationCriteriaLike {
  expertiseSkills?: ExpertiseSkillAssignmentLike[] | null;
  expertiseGroups?: ExpertiseGroupAssignmentLike[] | null;
  [key: string]: unknown;
}

export function buildExpertiseTestingResults(
  evaluationCriteria?: ExpertiseEvaluationCriteriaLike | null,
): TestingResult[] {
  const directSkills: TestingResult[] = (evaluationCriteria?.expertiseSkills || [])
    .filter(hasUsableExpertiseSkill)
    .map(assignment => buildTestingResultFromSkill({
      assignmentId: assignment.id,
      skill: assignment.skill,
    }));

  const existingSkillIds = createExistingSkillIdSet(directSkills);
  const groupSkills = buildGroupTestingResults(evaluationCriteria?.expertiseGroups, existingSkillIds);

  return [...directSkills, ...groupSkills];
}

function hasUsableExpertiseSkill(
  assignment: ExpertiseSkillAssignmentLike,
): assignment is ExpertiseSkillAssignmentLike & { skill: ExpertiseSkillLike & { id: string; name: string } } {
  return (
    assignment.skill?.isActive !== false &&
    typeof assignment.skill?.id === 'string' &&
    typeof assignment.skill.name === 'string'
  );
}

function hasUsableGroupSkill(skill: ExpertiseSkillLike): skill is ExpertiseSkillLike & { id: string; name: string } {
  return skill.isActive !== false && typeof skill.id === 'string' && typeof skill.name === 'string';
}

function buildTestingResultFromSkill({
  assignmentId,
  groupAssignmentId,
  groupName,
  skill,
}: {
  assignmentId?: string | null;
  groupAssignmentId?: string | null;
  groupName?: string | null;
  skill: ExpertiseSkillLike & { id: string; name: string };
}): TestingResult {
  return {
    id: skill.id,
    assignmentId: assignmentId || undefined,
    groupAssignmentId: groupAssignmentId || undefined,
    groupName: groupName || undefined,
    label: skill.name,
    score: 0,
    maxScore: skill.maxScore || 100,
  };
}

function createExistingSkillIdSet(testingResults: TestingResult[]) {
  return new Set(testingResults.map(skill => skill.id));
}

function buildGroupTestingResults(
  groupAssignments: ExpertiseGroupAssignmentLike[] | null | undefined,
  existingSkillIds: Set<string>,
) {
  const groupSkills: TestingResult[] = [];

  for (const groupAssignment of groupAssignments || []) {
    const groupName = groupAssignment?.group?.name;

    for (const skill of groupAssignment?.group?.skills || []) {
      if (!hasUsableGroupSkill(skill) || existingSkillIds.has(skill.id)) {
        continue;
      }

      existingSkillIds.add(skill.id);
      groupSkills.push(buildTestingResultFromSkill({
        groupAssignmentId: groupAssignment.id || undefined,
        groupName: groupName || undefined,
        skill,
      }));
    }
  }

  return groupSkills;
}
