import type {
  EvaluationTemplateApplyNamedItem,
  EvaluationTemplateApplyTask,
  EvaluationTemplateApplyTaskResult,
  EvaluationTemplateLike,
  PositionSkillLike,
  PositionTraitLike,
} from './evaluation-config-types';
import { getEvaluationTemplateIds } from './evaluation-config-template-utils';

function createEvaluationNameLookup(items: EvaluationTemplateApplyNamedItem[]) {
  return new Map(items.map(item => [item.id, item.name]));
}

function getEvaluationTemplateApplyName(lookup: Map<string, string>, id: string) {
  return lookup.get(id) || id;
}

export function buildEvaluationTemplateApplyTasks({
  template,
  positionSkills,
  positionTraits,
  expertiseGroups,
  expertiseSkills,
  personalityGroups,
  personalityTraits,
}: {
  template: EvaluationTemplateLike | null | undefined;
  positionSkills: PositionSkillLike[];
  positionTraits: PositionTraitLike[];
  expertiseGroups: EvaluationTemplateApplyNamedItem[];
  expertiseSkills: EvaluationTemplateApplyNamedItem[];
  personalityGroups: EvaluationTemplateApplyNamedItem[];
  personalityTraits: EvaluationTemplateApplyNamedItem[];
}): EvaluationTemplateApplyTask[] {
  const alreadySkillIds = new Set(positionSkills.map(positionSkill => positionSkill.skillId));
  const alreadyTraitIds = new Set(positionTraits.map(positionTrait => positionTrait.traitId));
  const {
    groupIds,
    skillIds,
    personalityGroupIds,
    traitIds,
  } = getEvaluationTemplateIds(template);
  const expertiseGroupNames = createEvaluationNameLookup(expertiseGroups);
  const expertiseSkillNames = createEvaluationNameLookup(expertiseSkills);
  const personalityGroupNames = createEvaluationNameLookup(personalityGroups);
  const personalityTraitNames = createEvaluationNameLookup(personalityTraits);

  return [
    ...groupIds.map(groupId => ({
      kind: 'expertise-group' as const,
      id: groupId,
      name: getEvaluationTemplateApplyName(expertiseGroupNames, groupId),
      payload: { groupId, isRequired: false, weight: 1.0 },
      duplicateOkStatus: 400,
    })),
    ...skillIds
      .filter(skillId => !alreadySkillIds.has(skillId))
      .map(skillId => ({
        kind: 'expertise-skill' as const,
        id: skillId,
        name: getEvaluationTemplateApplyName(expertiseSkillNames, skillId),
        payload: { skillId },
        duplicateOkStatus: 409,
      })),
    ...personalityGroupIds.map(groupId => ({
      kind: 'personality-group' as const,
      id: groupId,
      name: getEvaluationTemplateApplyName(personalityGroupNames, groupId),
      payload: { groupId, isRequired: false, weight: 1.0 },
      duplicateOkStatus: 400,
    })),
    ...traitIds
      .filter(traitId => !alreadyTraitIds.has(traitId))
      .map(traitId => ({
        kind: 'personality-trait' as const,
        id: traitId,
        name: getEvaluationTemplateApplyName(personalityTraitNames, traitId),
        payload: { traitId },
        duplicateOkStatus: 409,
      })),
  ];
}

export async function runEvaluationTemplateApplyTasks(
  tasks: EvaluationTemplateApplyTask[],
  executor: (task: EvaluationTemplateApplyTask) => Promise<EvaluationTemplateApplyTaskResult>,
  concurrency = 8
) {
  const results: EvaluationTemplateApplyTaskResult[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    if (index >= tasks.length) return;

    const task = tasks[index++];
    results.push(await executor(task));
    return runNext();
  }

  const runners = Array.from({ length: Math.min(Math.max(1, concurrency), tasks.length) }, () => runNext());
  await Promise.all(runners);

  return results;
}

export function summarizeEvaluationTemplateApplyResults(results: EvaluationTemplateApplyTaskResult[]) {
  const failedNames = results
    .filter(result => !result.ok)
    .map(result => result.name);
  const addedCount = results.filter(result => (
    result.ok &&
    (!result.status || (result.status >= 200 && result.status < 300))
  )).length;

  return {
    failedNames,
    addedCount,
    failureMessage: failedNames.length > 0
      ? `Some items failed to add: ${failedNames.slice(0, 5).join(', ')}${failedNames.length > 5 ? '...' : ''}`
      : null,
    successMessage: addedCount > 0 && failedNames.length === 0
      ? `Template applied successfully (${addedCount} items added)`
      : addedCount > 0
        ? `${addedCount} items added`
        : null,
  };
}
