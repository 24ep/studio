import type { SLABadgeVariant, SLACheckResult } from './sla-utils-types';

export function getSLABadgeVariant(daysOverdue: number): SLABadgeVariant {
  if (daysOverdue === 0) {
    return 'default';
  }

  if (daysOverdue > 0) {
    return 'destructive';
  }

  return 'default';
}

export function formatSLAMessage(slaResult: SLACheckResult): string {
  if (!slaResult.isViolated) {
    return `${slaResult.gradeName} - ${slaResult.slaDays} days SLA`;
  }

  return `${slaResult.gradeName} - ${slaResult.daysOverdue} days overdue (${slaResult.slaDays} days SLA)`;
}
