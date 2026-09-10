export const DEFAULT_STAGE_COLOR_CLASS = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';

const fallbackStageColorRules: Array<{ includes: string[]; className: string }> = [
  {
    includes: ['hired', 'offer accepted'],
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    includes: ['rejected', 'withdrawn'],
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  },
  {
    includes: ['interview'],
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  },
  {
    includes: ['offer extended'],
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  },
  {
    includes: ['shortlisted'],
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    includes: ['screening'],
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  },
  {
    includes: ['on hold'],
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  },
];

export interface RecruitmentStageColorResponse {
  id: string;
  color_badge?: string | null;
}

export function isRecruitmentStageColorResponse(value: unknown): value is RecruitmentStageColorResponse {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as { id?: unknown }).id === 'string'
  );
}

export function getStatusBadgeKey(status?: string | null, statusId?: string | null) {
  return statusId || status || null;
}

export function getStatusBadgeStageName(
  statusKey: string | null,
  stageNames: Record<string, string>,
) {
  return statusKey ? stageNames[statusKey] || null : null;
}

export function getStatusBadgeDisplayText({
  stageName,
  status,
  statusId,
}: {
  stageName: string | null;
  status?: string | null;
  statusId?: string | null;
}) {
  return stageName || status || statusId || 'Unknown';
}

export function shouldFetchStatusBadgeColor(
  statusKey: string | null,
  stageColors: Record<string, string>,
) {
  return Boolean(statusKey && Object.keys(stageColors).length === 0);
}

export function getCustomStageColorClass(stageColor: string) {
  return `bg-[${stageColor}]/10 text-[${stageColor}] border-[${stageColor}]/20 dark:bg-[${stageColor}]/20 dark:text-[${stageColor}] dark:border-[${stageColor}]/40`;
}

export function getFallbackStageColorClass(stageName: string) {
  const lowerStageName = stageName.toLowerCase();
  return fallbackStageColorRules.find(({ includes }) => (
    includes.some((fragment) => lowerStageName.includes(fragment))
  ))?.className ?? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
}

export function getStatusBadgeColorClass({
  localStageColors,
  stageName,
  statusKey,
}: {
  localStageColors: Record<string, string>;
  stageName: string | null;
  statusKey: string | null;
}) {
  if (statusKey && localStageColors[statusKey]) {
    return getCustomStageColorClass(localStageColors[statusKey]);
  }

  if (stageName) {
    return getFallbackStageColorClass(stageName);
  }

  return DEFAULT_STAGE_COLOR_CLASS;
}
