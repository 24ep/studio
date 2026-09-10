/**
 * SLA Types
 * Type definitions for SLA notification service
 */

export interface SLAViolationNotification {
  positionId: string;
  positionTitle: string;
  recruiterId: string | null;
  recruiterName: string | null;
  gradeName: string;
  daysOverdue: number;
  slaDays: number;
  requestDate: string;
  createdAt: string;
}

export interface SLAPositionData {
  positionId: string;
  positionTitle: string;
  department: string;
  recruiterId: string | null;
  recruiterName: string | null;
  gradeName: string;
  gradeColor: string;
  slaDays: number;
  requestDate: string;
  isViolated: boolean;
  daysOverdue: number;
  daysRemaining: number;
  status: SLAStatus;
  createdAt: string;
}

export interface PositionWithoutSLA {
  positionId: string;
  positionTitle: string;
  department: string;
  recruiterId: string | null;
  recruiterName: string | null;
  createdAt: string;
}

export interface SLAStatistics {
  total: number;
  onTrack: number;
  warning: number;
  critical: number;
  urgent: number;
  complianceRate: number;
  averageDaysOverdue: number;
  totalDaysOverdue: number;
  byGrade: {
    [gradeName: string]: {
      total: number;
      violations: number;
      complianceRate: number;
    };
  };
  byRecruiter: {
    [recruiterName: string]: {
      total: number;
      violations: number;
      complianceRate: number;
    };
  };
}

export interface SLAHeadcountData {
  headcountId: string;
  positionId: string;
  headcountType: string;
  headcountStatus: string;
  positionTitle: string;
  department: string;
  recruiterId: string | null;
  recruiterName: string | null;
  gradeName: string;
  gradeColor: string;
  slaDays: number;
  requestDate: string;
  onboardingDate: string | null;
  isViolated: boolean;
  daysOverdue: number;
  daysRemaining: number;
  status: SLAStatus;
  createdAt: string;
}

export type SLAStatus = 'on_track' | 'warning' | 'critical' | 'urgent';

/**
 * Determine SLA status based on violation and days
 */
export function determineSLAStatus(isViolated: boolean, daysOverdue: number, daysRemaining: number): SLAStatus {
  if (isViolated) {
    if (daysOverdue <= 7) return 'warning';
    if (daysOverdue <= 30) return 'critical';
    return 'urgent';
  }
  if (daysRemaining <= 7) {
    return 'warning';
  }
  return 'on_track';
}
