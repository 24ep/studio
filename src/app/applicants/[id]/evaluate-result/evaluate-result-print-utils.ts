import type { AveragedEvaluationData } from "./types";
import {
  groupExpertiseSkills,
  groupPersonalityTraits,
  type GroupConfig,
} from "./evaluate-result-grouping-utils";

export function buildEvaluateResultPrintGroupIds(
  averagedEvaluationData: AveragedEvaluationData | null,
  personalityGroupsConfig: GroupConfig[],
) {
  const allGroupIds = new Set<string>();

  for (const group of groupExpertiseSkills(averagedEvaluationData, personalityGroupsConfig)) {
    allGroupIds.add(group.groupId);
  }

  for (const group of groupPersonalityTraits(averagedEvaluationData, personalityGroupsConfig)) {
    allGroupIds.add(group.groupId);
  }

  return allGroupIds;
}
