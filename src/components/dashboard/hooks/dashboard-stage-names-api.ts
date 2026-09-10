import { readJsonOrFallback } from '@/lib/response-json';

interface StageNameRow {
  id: string;
  name: string;
}

export function getUniqueApplicantStageIds(statuses: Array<string | null | undefined>): string[] {
  return [...new Set(statuses.filter((status): status is string => Boolean(status)))];
}

export async function fetchDashboardStageNameMap(stageIds: string[]): Promise<Record<string, string>> {
  if (stageIds.length === 0) {
    return {};
  }

  const response = await fetch(`/api/settings/recruitment-stages?ids=${stageIds.join(',')}`);
  if (!response.ok) {
    return {};
  }

  return buildStageNameMap(await readJsonOrFallback<unknown>(response, []));
}

function buildStageNameMap(value: unknown): Record<string, string> {
  if (!Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    value
      .filter(isStageNameRow)
      .map((stage) => [stage.id, stage.name])
  );
}

function isStageNameRow(value: unknown): value is StageNameRow {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as StageNameRow).id === 'string' &&
    typeof (value as StageNameRow).name === 'string'
  );
}
