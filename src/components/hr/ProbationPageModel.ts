export interface ProbationEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  location: string | null;
  profilePhotoUrl: string | null;
  status: string;
  hireDate: string;
  positionId: string | null;
  positionTitle: string | null;
  managerName: string | null;
  managerJobTitle: string | null;
  positionProbationPeriodDays: number | null;
  positionEvaluationFrequencyDays: number | null;
  probationPeriodDays: number | null;
  evaluationFrequencyDays: number | null;
  effectivePeriodDays: number;
  effectiveFrequencyDays: number;
  probationStartDate: string;
  probationEndDate: string;
  nextEvaluationDate: string;
  evaluationNumber: number;
  daysRemaining: number;
  progressPercent: number;
}

export type RosterView = 'all' | 'due' | 'upcoming' | 'on-track' | 'overdue';

export function employeeName(employee: ProbationEmployee) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function initials(employee: ProbationEmployee) {
  return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase() || 'EE';
}

export function daysUntil(value: string) {
  const now = new Date();
  const target = new Date(value);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

export function rosterView(employee: ProbationEmployee): Exclude<RosterView, 'all'> {
  const days = daysUntil(employee.nextEvaluationDate);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due';
  if (days <= 30) return 'upcoming';
  return 'on-track';
}

export function evaluationMeta(employee: ProbationEmployee) {
  const days = daysUntil(employee.nextEvaluationDate);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, detail: 'Overdue', className: 'border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-300' };
  if (days === 0) return { label: 'Due today', detail: 'Today', className: 'border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-300' };
  if (days === 1) return { label: 'Due tomorrow', detail: 'Tomorrow', className: 'border-rose-500/35 bg-rose-500/10 text-rose-600 dark:text-rose-300' };
  if (days <= 7) return { label: 'Due this week', detail: `In ${days} days`, className: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300' };
  if (days <= 30) return { label: 'Upcoming', detail: `In ${days} days`, className: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300' };
  return { label: 'On track', detail: `In ${days} days`, className: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };
}

export function viewLabel(view: RosterView) {
  return view === 'due' ? 'Due this week' : view === 'on-track' ? 'On track' : view.charAt(0).toUpperCase() + view.slice(1);
}
