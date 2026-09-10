import type { ApplicantSettings } from './applicant-settings-types';
import type { Applicant, RecruitmentStage } from '@/lib/types';

export type ApplicantTableColumnKey =
  | 'applicant'
  | 'appliedJob'
  | 'jobMatches'
  | 'fitScore'
  | 'recruiter'
  | 'source'
  | 'status'
  | 'lastUpdate'
  | 'appliedDate'
  | 'createdAt'
  | 'createdDate';

interface ApplicantTableColumnHeader {
  className: string;
  label: string;
  sortKey: string;
}

type ApplicantTableVisibilitySettingKey =
  | 'showApplicantColumn'
  | 'showAppliedJobColumn'
  | 'showJobMatchesColumn'
  | 'showFitScoreColumn'
  | 'showRecruiterColumn'
  | 'showSourceColumn'
  | 'showStatusColumn'
  | 'showLastUpdateColumn'
  | 'showAppliedDateColumn'
  | 'showCreatedDateColumn';

interface ApplicantTableColumnConfig {
  header: ApplicantTableColumnHeader;
  requiresJobMatch?: boolean;
  visibilitySetting: ApplicantTableVisibilitySettingKey;
}

export interface ApplicantTableSortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export const DEFAULT_APPLICANT_TABLE_HEADER_COLUMN_ORDER: ApplicantTableColumnKey[] = [
  'applicant',
  'appliedJob',
  'jobMatches',
  'fitScore',
  'recruiter',
  'source',
  'status',
  'lastUpdate',
  'appliedDate',
];

const COUNTED_APPLICANT_TABLE_COLUMNS: ApplicantTableColumnKey[] = [
  ...DEFAULT_APPLICANT_TABLE_HEADER_COLUMN_ORDER,
  'createdAt',
];

const APPLICANT_TABLE_COLUMN_CONFIG: Record<ApplicantTableColumnKey, ApplicantTableColumnConfig> = {
  applicant: {
    header: { label: 'Applicant', className: 'min-w-[200px] w-[25%]', sortKey: 'applicant' },
    visibilitySetting: 'showApplicantColumn',
  },
  appliedJob: {
    header: { label: 'Applied Job', className: 'min-w-[150px] w-[15%]', sortKey: 'appliedJob' },
    visibilitySetting: 'showAppliedJobColumn',
  },
  jobMatches: {
    header: { label: 'Matches', className: 'w-[120px]', sortKey: 'jobMatches' },
    requiresJobMatch: true,
    visibilitySetting: 'showJobMatchesColumn',
  },
  fitScore: {
    header: { label: 'Fit Score', className: 'w-[100px] text-center', sortKey: 'fitScore' },
    visibilitySetting: 'showFitScoreColumn',
  },
  recruiter: {
    header: { label: 'Recruiter', className: 'w-[120px]', sortKey: 'recruiter' },
    visibilitySetting: 'showRecruiterColumn',
  },
  source: {
    header: { label: 'Source', className: 'w-[120px]', sortKey: 'source' },
    visibilitySetting: 'showSourceColumn',
  },
  status: {
    header: { label: 'Status', className: 'w-[120px]', sortKey: 'status' },
    visibilitySetting: 'showStatusColumn',
  },
  lastUpdate: {
    header: { label: 'Last Update', className: 'w-[120px]', sortKey: 'lastUpdate' },
    visibilitySetting: 'showLastUpdateColumn',
  },
  appliedDate: {
    header: { label: 'Applied Date', className: 'w-[120px]', sortKey: 'appliedDate' },
    visibilitySetting: 'showAppliedDateColumn',
  },
  createdAt: {
    header: { label: 'Created Date', className: 'w-[120px]', sortKey: 'createdAt' },
    visibilitySetting: 'showCreatedDateColumn',
  },
  createdDate: {
    header: { label: 'Created Date', className: 'w-[120px]', sortKey: 'createdAt' },
    visibilitySetting: 'showCreatedDateColumn',
  },
};

const APPLICANT_TABLE_COLUMN_KEYS = Object.keys(APPLICANT_TABLE_COLUMN_CONFIG) as ApplicantTableColumnKey[];
const APPLICANT_TABLE_COLUMN_KEY_SET = new Set(APPLICANT_TABLE_COLUMN_KEYS);
const FIXED_APPLICANT_TABLE_COLUMN_COUNT = 3;
const ACTION_APPLICANT_TABLE_COLUMN_COUNT = 1;

export function getApplicantTableColumnOrder(settings?: ApplicantSettings): ApplicantTableColumnKey[] {
  return (settings?.columnOrder?.length ? settings.columnOrder : DEFAULT_APPLICANT_TABLE_HEADER_COLUMN_ORDER)
    .filter((columnKey): columnKey is ApplicantTableColumnKey => isApplicantTableColumnKey(columnKey));
}

export function shouldShowApplicantTableColumn(
  settings: ApplicantSettings | undefined,
  columnKey: ApplicantTableColumnKey,
  isJobMatchEnabled = true
) {
  const config = APPLICANT_TABLE_COLUMN_CONFIG[columnKey];
  return settings?.[config.visibilitySetting] !== false && (!config.requiresJobMatch || isJobMatchEnabled);
}

export function getApplicantTableVisibleColumnCount(settings?: ApplicantSettings) {
  const visibleConfigurableCount = COUNTED_APPLICANT_TABLE_COLUMNS.filter((columnKey) =>
    shouldShowApplicantTableColumn(settings, columnKey)
  ).length;

  return FIXED_APPLICANT_TABLE_COLUMN_COUNT + visibleConfigurableCount + ACTION_APPLICANT_TABLE_COLUMN_COUNT;
}

export function getApplicantTableColumnHeader(
  columnKey: ApplicantTableColumnKey
): ApplicantTableColumnHeader | null {
  return APPLICANT_TABLE_COLUMN_CONFIG[columnKey]?.header ?? null;
}

export function getApplicantTableNextSortState({
  column,
  currentSortColumn,
  currentSortDirection,
}: {
  column: string;
  currentSortColumn: string | null;
  currentSortDirection: 'asc' | 'desc' | null;
}): ApplicantTableSortState {
  if (currentSortColumn !== column) {
    return { column, direction: 'asc' };
  }

  if (currentSortDirection === 'asc') {
    return { column, direction: 'desc' };
  }

  if (currentSortDirection === 'desc') {
    return { column: null, direction: null };
  }

  return { column, direction: 'asc' };
}

export function shouldOpenApplicantTableRowDetail({
  defaultPrevented,
  isInteractiveTarget,
  isDialogTarget,
}: {
  defaultPrevented: boolean;
  isInteractiveTarget: boolean;
  isDialogTarget: boolean;
}) {
  return !defaultPrevented && !isInteractiveTarget && !isDialogTarget;
}

export function getApplicantTableStageIds(applicants: Applicant[]) {
  return Array.from(new Set(
    applicants
      .map(applicant => applicant.statusId)
      .filter((statusId): statusId is string => Boolean(statusId))
  ));
}

export function buildApplicantTableStageNames(stages: RecruitmentStage[]) {
  return stages.reduce<Record<string, string>>((stageNames, stage) => {
    if (stage.id && stage.name) {
      stageNames[stage.id] = stage.name;
    }
    return stageNames;
  }, {});
}

function isApplicantTableColumnKey(columnKey: string): columnKey is ApplicantTableColumnKey {
  return APPLICANT_TABLE_COLUMN_KEY_SET.has(columnKey as ApplicantTableColumnKey);
}
