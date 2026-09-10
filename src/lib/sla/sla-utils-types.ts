import type { Headcount, Position } from '@/lib/types';

export interface SLACheckResult {
  isViolated: boolean;
  daysOverdue: number;
  slaDays: number;
  gradeName: string;
  gradeColor: string;
}

export type SLABadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'warning';

export type HeadcountWithSLAPosition = Pick<Headcount, 'applicantId' | 'requestDate' | 'status'> & {
  position?: Pick<Position, 'grade'> | null;
};

export interface HeadcountSLACheckResult extends SLACheckResult {
  daysRemaining: number;
  requestDate: string;
  endDate: string;
  calculationType: 'filled_no_hired_date' | 'filled_with_hired_date' | 'vacant';
  daysElapsed: number;
}
