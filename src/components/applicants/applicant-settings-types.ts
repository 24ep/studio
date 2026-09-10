export type ApplicantGroupBy = 'none' | 'position' | 'recruiter' | 'status';

export interface ApplicantSettings {
  showApplicantColumn: boolean;
  showAppliedJobColumn: boolean;
  showJobMatchesColumn: boolean;
  showFitScoreColumn: boolean;
  showRecruiterColumn: boolean;
  showSourceColumn: boolean;
  showStatusColumn: boolean;
  showAppliedDateColumn: boolean;
  showLastUpdateColumn: boolean;
  showCreatedDateColumn: boolean;
  columnOrder: string[];
  showFilters: boolean;
  showHorizontalFitScoreFilters: boolean;
  fitScoreType: 'applied' | 'matching';
  fitScoreFilterMode: 'single' | 'multi';
  rowHeight: 'compact' | 'normal' | 'comfortable';
  showPinSection: boolean;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc' | null;
  groupBy: ApplicantGroupBy;
}
