export type ProbationDecisionOutcome = 'confirm' | 'extend' | 'end';

export interface ProbationDecisionMutation {
  employeeStatus: 'active' | 'probation' | 'inactive';
  endDate: string | null;
  probationPeriodDays: number | null;
}

function utcDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildProbationDecisionMutation(
  outcome: ProbationDecisionOutcome,
  hireDate: string | Date,
  effectiveDate: string,
): ProbationDecisionMutation {
  const start = hireDate instanceof Date ? hireDate : new Date(hireDate);
  const decisionDate = utcDay(effectiveDate);
  if (Number.isNaN(start.getTime()) || !decisionDate) {
    throw new Error('A valid probation start and effective date are required.');
  }
  const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  if (decisionDate.getTime() < startUtc) {
    throw new Error('The effective date cannot be before the employee hire date.');
  }

  if (outcome === 'confirm') {
    return { employeeStatus: 'active', endDate: null, probationPeriodDays: null };
  }
  if (outcome === 'end') {
    return { employeeStatus: 'inactive', endDate: effectiveDate, probationPeriodDays: null };
  }

  const extendedDays = Math.ceil((decisionDate.getTime() - startUtc) / 86_400_000);
  if (extendedDays < 1 || extendedDays > 730) {
    throw new Error('The new probation end date must be after the hire date and within two years.');
  }
  return { employeeStatus: 'probation', endDate: null, probationPeriodDays: extendedDays };
}
