import type { Position } from '@/lib/types';
import {
  getDeadlineDate,
  getRemainingDaysUntil,
  getWholeDaysBetween,
} from './sla-date-utils';
import {
  getEarliestRequestDateForPosition,
  getHiredDateForHeadcount,
} from './sla-data-queries';
import type {
  HeadcountSLACheckResult,
  HeadcountWithSLAPosition,
  SLACheckResult,
} from './sla-utils-types';

export async function checkSLAViolation(position: Position): Promise<SLACheckResult | null> {
  if (!position.grade) {
    return null;
  }

  const effectiveStartDate = await getEffectiveSLAStartDate(position);
  if (!effectiveStartDate) {
    return null;
  }

  const currentDate = new Date();
  const slaDays = position.grade.slaDays;
  const targetDate = getDeadlineDate(effectiveStartDate, slaDays);
  const isViolated = currentDate > targetDate;

  return {
    isViolated,
    daysOverdue: isViolated ? getWholeDaysBetween(targetDate, currentDate) : 0,
    slaDays,
    gradeName: position.grade.name,
    gradeColor: position.grade.color || '#3B82F6',
  };
}

export async function getSLARemainingDays(position: Position): Promise<number | null> {
  if (!position.grade) {
    return null;
  }

  const effectiveStartDate = await getEffectiveSLAStartDate(position);
  if (!effectiveStartDate) {
    return null;
  }

  return getRemainingDaysUntil(getDeadlineDate(effectiveStartDate, position.grade.slaDays));
}

export async function checkSLAViolationForHeadcount(
  headcount: HeadcountWithSLAPosition
): Promise<HeadcountSLACheckResult | null> {
  if (!headcount.requestDate) {
    return null;
  }

  const grade = headcount.position?.grade;
  if (!grade || !grade.slaDays) {
    return null;
  }

  const requestDate = new Date(headcount.requestDate);
  const { calculationType, endDate } = await resolveHeadcountSLAEndDate(headcount);
  const daysElapsed = getWholeDaysBetween(requestDate, endDate);
  const isViolated = daysElapsed > grade.slaDays;

  return {
    isViolated,
    daysOverdue: isViolated ? daysElapsed - grade.slaDays : 0,
    daysRemaining: isViolated ? 0 : grade.slaDays - daysElapsed,
    slaDays: grade.slaDays,
    gradeName: grade.name,
    gradeColor: grade.color || '#3B82F6',
    requestDate: requestDate.toISOString(),
    endDate: endDate.toISOString(),
    calculationType,
    daysElapsed,
  };
}

export async function getSLARemainingDaysForHeadcount(
  headcount: HeadcountWithSLAPosition
): Promise<number | null> {
  const violationResult = await checkSLAViolationForHeadcount(headcount);
  return violationResult ? violationResult.daysRemaining : null;
}

export async function getEffectiveSLAStartDate(position: Position): Promise<Date | null> {
  if (!position.id) {
    return null;
  }

  try {
    return await getEarliestRequestDateForPosition(position.id);
  } catch (error) {
    console.error('Error getting effective SLA start date:', error);
    return null;
  }
}

async function resolveHeadcountSLAEndDate(
  headcount: HeadcountWithSLAPosition
): Promise<Pick<HeadcountSLACheckResult, 'calculationType'> & { endDate: Date }> {
  if (headcount.status !== 'filled' || !headcount.applicantId) {
    return {
      calculationType: 'vacant',
      endDate: new Date(),
    };
  }

  const hiredDate = await getHiredDateForHeadcount(headcount);
  if (!hiredDate) {
    return {
      calculationType: 'filled_no_hired_date',
      endDate: new Date(),
    };
  }

  return {
    calculationType: 'filled_with_hired_date',
    endDate: hiredDate,
  };
}
