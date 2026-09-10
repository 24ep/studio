import type { HeadcountStatus, Position } from '@/lib/types';
import type { HeadcountSLACheckResult, SLACheckResult } from '../slaUtils';
import type {
  SLAHeadcountData,
  SLAPositionData,
  SLAViolationNotification,
  PositionWithoutSLA,
} from './types';
import { determineSLAStatus } from './types';

export type SLAPositionRow = {
  [key: string]: unknown;
  id: string;
  title: string;
  department: string;
  requestDate: string;
  recruiterId: string | null;
  recruiterName: string | null;
  gradeName: string;
  slaDays: number;
  gradeColor: string;
  createdAt: string;
};

export type PositionWithoutSLARow = {
  [key: string]: unknown;
  positionId: string;
  positionTitle: string;
  department: string;
  recruiterId: string | null;
  recruiterName: string | null;
  createdAt: string;
};

export type SLAHeadcountRow = {
  [key: string]: unknown;
  headcountId: string;
  positionId: string;
  headcountType: string;
  headcountStatus: HeadcountStatus;
  applicantId: string | null;
  requestDate: string;
  onboardingDate: string | null;
  positionTitle: string;
  positionDepartment: string;
  recruiterId: string | null;
  recruiterName: string | null;
  gradeName: string;
  slaDays: number;
  gradeColor: string;
  createdAt: string;
};

export function buildSLAPosition(row: SLAPositionRow, department = row.department): Position {
  return {
    id: row.id,
    title: row.title,
    department,
    isOpen: true,
    grade: {
      id: '',
      name: row.gradeName,
      slaDays: row.slaDays,
      color: row.gradeColor,
      isActive: true,
      sortOrder: 0,
      minLevel: 0,
      maxLevel: 0,
    },
    recruiterId: row.recruiterId,
    recruiterName: row.recruiterName,
  };
}

export function mapPositionWithoutSLA(row: PositionWithoutSLARow): PositionWithoutSLA {
  return {
    positionId: row.positionId,
    positionTitle: row.positionTitle,
    department: row.department,
    recruiterId: row.recruiterId,
    recruiterName: row.recruiterName,
    createdAt: row.createdAt,
  };
}

export function buildSLAHeadcount(row: SLAHeadcountRow) {
  return {
    id: row.headcountId,
    positionId: row.positionId,
    type: row.headcountType,
    status: row.headcountStatus,
    applicantId: row.applicantId,
    requestDate: row.requestDate,
    onboardingDate: row.onboardingDate,
    position: {
      id: row.positionId,
      title: row.positionTitle,
      department: row.positionDepartment,
      recruiterId: row.recruiterId,
      recruiterName: row.recruiterName,
      grade: {
        id: '',
        name: row.gradeName,
        slaDays: row.slaDays,
        color: row.gradeColor,
        isActive: true,
        sortOrder: 0,
        minLevel: 0,
        maxLevel: 0,
      },
    },
  };
}

export function mapSLAPositionData(
  row: SLAPositionRow,
  position: Position,
  slaResult: SLACheckResult | null,
  daysRemaining: number
): SLAPositionData {
  const isViolated = slaResult ? slaResult.isViolated : false;
  const daysOverdue = slaResult ? slaResult.daysOverdue : 0;

  return {
    positionId: position.id,
    positionTitle: position.title,
    department: position.department,
    recruiterId: position.recruiterId || null,
    recruiterName: position.recruiterName || null,
    gradeName: row.gradeName,
    gradeColor: row.gradeColor,
    slaDays: row.slaDays,
    requestDate: row.requestDate,
    isViolated,
    daysOverdue,
    daysRemaining,
    status: determineSLAStatus(isViolated, daysOverdue, daysRemaining),
    createdAt: row.createdAt,
  };
}

export function mapSLAHeadcountData(
  row: SLAHeadcountRow,
  headcount: ReturnType<typeof buildSLAHeadcount>,
  slaResult: HeadcountSLACheckResult | null
): SLAHeadcountData {
  const isViolated = slaResult ? slaResult.isViolated : false;
  const daysOverdue = slaResult ? slaResult.daysOverdue : 0;
  const daysRemaining = slaResult ? slaResult.daysRemaining : 0;

  return {
    headcountId: headcount.id,
    positionId: headcount.positionId,
    headcountType: headcount.type,
    headcountStatus: headcount.status,
    positionTitle: headcount.position.title,
    department: headcount.position.department,
    recruiterId: headcount.position.recruiterId || null,
    recruiterName: headcount.position.recruiterName || null,
    gradeName: row.gradeName,
    gradeColor: row.gradeColor,
    slaDays: row.slaDays,
    requestDate: row.requestDate,
    onboardingDate: row.onboardingDate,
    isViolated,
    daysOverdue,
    daysRemaining,
    status: determineSLAStatus(isViolated, daysOverdue, daysRemaining),
    createdAt: row.createdAt,
  };
}

export function mapSLAViolationNotification(
  row: SLAPositionRow,
  position: Position,
  slaResult: SLACheckResult
): SLAViolationNotification {
  return {
    positionId: position.id,
    positionTitle: position.title,
    recruiterId: position.recruiterId || null,
    recruiterName: position.recruiterName || null,
    gradeName: slaResult.gradeName,
    daysOverdue: slaResult.daysOverdue,
    slaDays: slaResult.slaDays,
    requestDate: row.requestDate,
    createdAt: new Date().toISOString(),
  };
}
