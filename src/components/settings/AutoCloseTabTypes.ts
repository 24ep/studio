export interface AutoCloseResult {
  positionId: string;
  positionTitle: string;
  success: boolean;
  message: string;
  action: 'closed' | 'none' | 'error';
  headcountStatus?: {
    totalHeadcounts: number;
    filledHeadcounts: number;
    vacantHeadcounts: number;
  };
}

export interface AutoCloseSummary {
  totalProcessed: number;
  closedCount: number;
  errorCount: number;
  noActionCount: number;
}

export interface AutoClosePermissionUser {
  role?: string | null;
  modulePermissions?: string[] | null;
}
