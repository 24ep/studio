/**
 * Headcount Types
 * Type definitions for headcount operations
 */

export interface HeadcountStatus {
  isFilled: boolean;
  totalHeadcounts: number;
  filledHeadcounts: number;
  vacantHeadcounts: number;
  hasHeadcounts: boolean;
}

export interface PositionAutomationSummary extends Record<string, unknown> {
  id: string;
  title: string;
  isOpen: boolean;
  department: string | null;
  customAttributes?: unknown;
  custom_attributes?: unknown;
  updatedAt?: Date | string;
}

export interface PositionActionResult {
  success: boolean;
  message: string;
  action: 'closed' | 'opened' | 'reopened' | 'none' | 'error';
  headcountStatus?: HeadcountStatus;
  position?: PositionAutomationSummary;
}

export interface HeadcountApplicantSummary {
  id: string;
  name: string | null;
  email: string | null;
  statusId: string | null;
}

export interface HeadcountPositionSummary {
  id: string;
  title: string;
}

export interface ValidationResult {
  canHire: boolean;
  reason: 'NO_HEADCOUNT' | 'NO_VACANT_HEADCOUNT' | 'ALREADY_ASSIGNED' | 'VACANT_HEADCOUNT_AVAILABLE';
  message: string;
  headcountId?: string;
  availableHeadcountId?: string;
  headcountStatus: {
    hasHeadcounts: boolean;
    totalHeadcounts: number;
    vacantHeadcounts: number;
    filledHeadcounts: number;
  };
}

export interface UnassignWarning {
  hasWarning: boolean;
  warningType?: 'APPLICANT_STATUS_WILL_CHANGE';
  message?: string;
  applicant?: HeadcountApplicantSummary;
  position?: HeadcountPositionSummary;
}

export interface AssignmentResult {
  success: boolean;
  message: string;
  headcountId?: string;
  autoCloseResult?: PositionActionResult | null;
}

export interface UnassignmentResult {
  success: boolean;
  message: string;
  statusUpdateResult?: {
    statusChanged: boolean;
    oldStatus: string;
    newStatus: string;
    transitionId: string;
  } | null;
}

export interface BatchCloseResult extends PositionActionResult {
  positionId: string;
  positionTitle: string;
}
