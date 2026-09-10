import type { ApplicantSettings } from './applicant-settings-types';

export interface ApplicantSettingsColumnConfig {
  key: string;
  label: string;
  settingKey: keyof ApplicantSettings;
}

export const DEFAULT_APPLICANT_SETTINGS: ApplicantSettings = {
  showApplicantColumn: true,
  showAppliedJobColumn: true,
  showJobMatchesColumn: true,
  showFitScoreColumn: true,
  showRecruiterColumn: true,
  showSourceColumn: true,
  showStatusColumn: true,
  showAppliedDateColumn: true,
  showLastUpdateColumn: false,
  showCreatedDateColumn: false,
  columnOrder: [
    'applicant',
    'appliedJob',
    'jobMatches',
    'fitScore',
    'recruiter',
    'source',
    'status',
    'appliedDate',
    'lastUpdate',
    'createdAt',
  ],
  showFilters: true,
  showHorizontalFitScoreFilters: true,
  fitScoreType: 'applied',
  fitScoreFilterMode: 'single',
  rowHeight: 'normal',
  showPinSection: false,
  pageSize: 20,
  sortColumn: 'applicationDate',
  sortDirection: 'desc',
  groupBy: 'none',
};

export const APPLICANT_SETTINGS_COLUMN_CONFIG: ApplicantSettingsColumnConfig[] = [
  { key: 'applicant', label: 'Applicant Name', settingKey: 'showApplicantColumn' },
  { key: 'appliedJob', label: 'Applied Job', settingKey: 'showAppliedJobColumn' },
  { key: 'jobMatches', label: 'Job Matches Count', settingKey: 'showJobMatchesColumn' },
  { key: 'fitScore', label: 'Fit Score', settingKey: 'showFitScoreColumn' },
  { key: 'recruiter', label: 'Recruiter', settingKey: 'showRecruiterColumn' },
  { key: 'source', label: 'Source', settingKey: 'showSourceColumn' },
  { key: 'status', label: 'Status', settingKey: 'showStatusColumn' },
  { key: 'appliedDate', label: 'Applied Date', settingKey: 'showAppliedDateColumn' },
  { key: 'lastUpdate', label: 'Last Update', settingKey: 'showLastUpdateColumn' },
  { key: 'createdAt', label: 'Created Date', settingKey: 'showCreatedDateColumn' },
];

export function mergeApplicantSettings(
  currentSettings?: Partial<ApplicantSettings> | null,
  previousSettings?: Partial<ApplicantSettings> | null
): ApplicantSettings {
  return {
    ...DEFAULT_APPLICANT_SETTINGS,
    ...previousSettings,
    ...currentSettings,
  };
}

export function getApplicantSettingsColumn(columnKey: string) {
  return APPLICANT_SETTINGS_COLUMN_CONFIG.find(column => column.key === columnKey) || null;
}

export function shouldShowApplicantSettingsColumn(columnKey: string, isJobMatchEnabled: boolean) {
  return columnKey !== 'jobMatches' || isJobMatchEnabled;
}

export function reorderApplicantSettingsColumns({
  columnOrder,
  sourceIndex,
  destinationIndex,
}: {
  columnOrder: readonly string[];
  sourceIndex: number;
  destinationIndex?: number | null;
}) {
  if (destinationIndex === null || destinationIndex === undefined) {
    return [...columnOrder];
  }

  const nextColumnOrder = [...columnOrder];
  const [reorderedItem] = nextColumnOrder.splice(sourceIndex, 1);

  if (!reorderedItem) {
    return [...columnOrder];
  }

  nextColumnOrder.splice(destinationIndex, 0, reorderedItem);
  return nextColumnOrder;
}

export function getApplicantSettingsSaveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to save settings';
}
