import type { SLAHeadcountData } from '../../lib/slaNotificationService';

export interface SLAHeadcountSummaryEntry {
  requestDate: string;
  count: number;
  daysRemaining: number | null;
  isOverdue: boolean;
}

export function buildSLAHeadcountSummaryForPosition(
  headcounts: SLAHeadcountData[],
  positionId: string,
): SLAHeadcountSummaryEntry[] {
  const groupedByRequestDate: Record<string, SLAHeadcountSummaryEntry> = {};

  getCriticalVacantHeadcounts(headcounts, positionId).forEach((headcount) => {
    const requestDate = getSLARequestDateKey(headcount.requestDate);
    const key = `${requestDate}_${headcount.daysRemaining || 'overdue'}`;

    groupedByRequestDate[key] ??= {
      requestDate,
      count: 0,
      daysRemaining: headcount.daysRemaining,
      isOverdue: headcount.isViolated,
    };
    groupedByRequestDate[key].count += 1;
  });

  return Object.values(groupedByRequestDate).sort(compareSLAHeadcountSummaryEntries);
}

function getCriticalVacantHeadcounts(headcounts: SLAHeadcountData[], positionId: string) {
  return headcounts.filter((headcount) =>
    headcount.positionId === positionId &&
    headcount.headcountStatus === 'vacant' &&
    isCriticalSLAHeadcount(headcount),
  );
}

function isCriticalSLAHeadcount(headcount: SLAHeadcountData) {
  return headcount.isViolated ||
    (typeof headcount.daysRemaining === 'number' && headcount.daysRemaining <= 3);
}

function getSLARequestDateKey(requestDate: string | null | undefined) {
  return requestDate ? new Date(requestDate).toISOString().split('T')[0] : 'unknown';
}

function compareSLAHeadcountSummaryEntries(
  a: SLAHeadcountSummaryEntry,
  b: SLAHeadcountSummaryEntry,
) {
  if (a.isOverdue && !b.isOverdue) return -1;
  if (!a.isOverdue && b.isOverdue) return 1;
  if (a.daysRemaining === null && b.daysRemaining === null) return 0;
  if (a.daysRemaining === null) return 1;
  if (b.daysRemaining === null) return -1;
  return a.daysRemaining - b.daysRemaining;
}
