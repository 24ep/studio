"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { HrisEmptyState } from '@/components/hris/HrisWorkspacePrimitives';
import { formatProbationDate } from '@/lib/hr/probation';
import { cn } from '@/lib/utils';
import { ProbationDecisionPanel } from './ProbationDecisionPanel';
import {
  daysUntil,
  employeeName,
  evaluationMeta,
  initials,
  rosterView,
  viewLabel,
  type ProbationEmployee,
  type RosterView,
} from './ProbationPageModel';

interface ProbationResponse {
  employees?: ProbationEmployee[];
  message?: string;
  canManage?: boolean;
  summary?: {
    total: number;
    evaluationsDueInSevenDays: number;
    endingInThirtyDays: number;
  };
}

const emptySummary = {
  total: 0,
  evaluationsDueInSevenDays: 0,
  endingInThirtyDays: 0,
};

export function ProbationPage() {
  const [employees, setEmployees] = React.useState<ProbationEmployee[]>([]);
  const [summary, setSummary] = React.useState(emptySummary);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<RosterView>('all');
  const [query, setQuery] = React.useState('');
  const [position, setPosition] = React.useState('all');
  const [location, setLocation] = React.useState('all');
  const [canManage, setCanManage] = React.useState(false);

  const loadProbation = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hr/probation', { credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as ProbationResponse;
      if (!response.ok) throw new Error(payload.message || 'Unable to load probation employees.');
      const nextEmployees = payload.employees || [];
      setEmployees(nextEmployees);
      setSummary(payload.summary || emptySummary);
      setCanManage(Boolean(payload.canManage));
      setSelectedId(current => current && nextEmployees.some(employee => employee.id === current)
        ? current
        : nextEmployees[0]?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load probation employees.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProbation();
  }, [loadProbation]);

  const positions = React.useMemo(
    () => Array.from(new Set(employees.map(employee => employee.positionTitle).filter(Boolean) as string[])).sort(),
    [employees],
  );
  const locations = React.useMemo(
    () => Array.from(new Set(employees.map(employee => employee.location).filter(Boolean) as string[])).sort(),
    [employees],
  );
  const counts = React.useMemo(() => employees.reduce<Record<RosterView, number>>((total, employee) => {
    total.all += 1;
    total[rosterView(employee)] += 1;
    return total;
  }, { all: 0, due: 0, upcoming: 0, 'on-track': 0, overdue: 0 }), [employees]);

  const filteredEmployees = React.useMemo(() => employees.filter(employee => {
    if (activeView !== 'all' && rosterView(employee) !== activeView) return false;
    if (position !== 'all' && employee.positionTitle !== position) return false;
    if (location !== 'all' && employee.location !== location) return false;
    const searchTarget = `${employeeName(employee)} ${employee.employeeNumber} ${employee.email} ${employee.positionTitle || ''} ${employee.managerName || ''}`.toLowerCase();
    return searchTarget.includes(query.trim().toLowerCase());
  }), [activeView, employees, location, position, query]);

  const groupedEmployees = React.useMemo(() => {
    const groups: Array<{ key: Exclude<RosterView, 'all'>; employees: ProbationEmployee[] }> = [
      { key: 'overdue', employees: [] },
      { key: 'due', employees: [] },
      { key: 'upcoming', employees: [] },
      { key: 'on-track', employees: [] },
    ];
    filteredEmployees.forEach(employee => groups.find(group => group.key === rosterView(employee))?.employees.push(employee));
    return groups.filter(group => group.employees.length > 0);
  }, [filteredEmployees]);

  const selectedEmployee = employees.find(employee => employee.id === selectedId) || null;

  return (
    <main className="min-h-full w-full bg-background text-foreground">
      <div className="min-h-[calc(100vh-7rem)]">
        <section className="min-w-0">
          <header className="flex min-h-[100px] flex-col gap-4 border-b border-border/80 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Probation</h1>
              <p className="mt-1 text-sm text-muted-foreground">Review probation evaluations and confirmation decisions that need your attention.</p>
            </div>
          </header>

          {error ? (
            <div className="m-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:m-6">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadProbation()}>
                <ArrowPathIcon className="mr-2 h-4 w-4" aria-hidden /> Retry
              </Button>
            </div>
          ) : null}

          <div className="border-b border-border/80 px-4 sm:px-6">
            <div className="flex min-w-max gap-7 overflow-x-auto">
              {(['all', 'due', 'upcoming', 'on-track', 'overdue'] as RosterView[]).map(view => (
                <button
                  key={view}
                  type="button"
                  className={cn(
                    'relative py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                    activeView === view && 'text-primary',
                  )}
                  onClick={() => setActiveView(view)}
                >
                  {viewLabel(view)} <span className="ml-1 tabular-nums">{counts[view]}</span>
                  {activeView === view ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1 lg:max-w-[330px]">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people" className="pl-9" />
            </label>
            <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
              <FilterSelect label="Position" value={position} options={positions} onChange={setPosition} />
              <FilterSelect label="Location" value={location} options={locations} onChange={setLocation} />
              <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden /> Due date (earliest)
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[930px]">
              <div className="grid grid-cols-[32px_1.55fr_1.2fr_118px_108px_1.25fr_1fr_108px] gap-3 border-b border-border/80 px-5 py-3 text-xs font-medium text-muted-foreground">
                <span aria-hidden />
                <span>Employee</span>
                <span>Role</span>
                <span>Evaluation</span>
                <span>Remaining</span>
                <span>Progress</span>
                <span>Manager</span>
                <span>Status</span>
              </div>

              {isLoading ? (
                <div className="divide-y divide-border/70">
                  {Array.from({ length: 6 }).map((_, index) => <RosterSkeleton key={index} />)}
                </div>
              ) : groupedEmployees.length ? (
                groupedEmployees.map(group => (
                  <div key={group.key}>
                    <div className={cn(
                      'border-b border-border/70 px-5 py-2.5 text-xs font-semibold',
                      group.key === 'overdue' || group.key === 'due' ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground',
                    )}>
                      {viewLabel(group.key)} ({group.employees.length})
                    </div>
                    <div className="divide-y divide-border/70">
                      {group.employees.map(employee => (
                        <ProbationRosterRow
                          key={employee.id}
                          employee={employee}
                          selected={selectedId === employee.id}
                          onSelect={() => setSelectedId(employee.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <HrisEmptyState
                  icon={UserIcon}
                  title={employees.length ? 'No probation records match' : 'No unresolved probation reviews'}
                  description={employees.length
                    ? 'Try another view or clear your search and filters.'
                    : 'Employees appear here after they have a hire date and remain until HR records a final probation decision.'}
                  action={employees.length
                    ? <Button variant="outline" size="sm" onClick={() => { setActiveView('all'); setQuery(''); setPosition('all'); setLocation('all'); }}>Clear filters</Button>
                    : <Button asChild variant="outline" size="sm"><Link href="/settings/policy-configuration?area=people-lifecycle">Review probation policy</Link></Button>}
                />
              )}
            </div>
          </div>
          {!isLoading && filteredEmployees.length ? (
            <p className="border-t border-border/70 px-5 py-4 text-xs text-muted-foreground">Showing {filteredEmployees.length} of {summary.total} employees</p>
          ) : null}
        </section>

        <Sheet open={Boolean(selectedEmployee)} onOpenChange={open => { if (!open) setSelectedId(null); }}>
          {selectedEmployee ? (
            <ProbationDecisionPanel
              employee={selectedEmployee}
              canManage={canManage}
              onDecisionRecorded={loadProbation}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </Sheet>
      </div>
    </main>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="h-10 min-w-36 rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground">
        <option value="all">{label}: All</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function RosterSkeleton() {
  return (
    <div className="grid grid-cols-[32px_1.55fr_1.2fr_118px_108px_1.25fr_1fr_108px] items-center gap-3 px-5 py-4">
      {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-4 animate-pulse rounded bg-muted" />)}
    </div>
  );
}

function ProbationRosterRow({ employee, selected, onSelect }: { employee: ProbationEmployee; selected: boolean; onSelect: () => void }) {
  const meta = evaluationMeta(employee);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'grid w-full grid-cols-[32px_1.55fr_1.2fr_118px_108px_1.25fr_1fr_108px] items-center gap-3 px-5 py-4 text-left text-sm transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        selected && 'bg-primary/[0.07] ring-1 ring-inset ring-primary',
      )}
    >
      <CheckCircleIcon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground/70')} aria-hidden />
      <span className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0 rounded-full">
          {employee.profilePhotoUrl ? <AvatarImage src={employee.profilePhotoUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{initials(employee)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{employeeName(employee)}</span>
          <span className="block truncate text-xs text-muted-foreground">{employee.employeeNumber}</span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{employee.positionTitle || 'Position not linked'}</span>
        <span className="block truncate text-xs text-muted-foreground">{employee.location || 'Location not set'}</span>
      </span>
      <span>
        <span className="block font-medium">{formatProbationDate(employee.nextEvaluationDate)}</span>
        <span className={cn('block text-xs', daysUntil(employee.nextEvaluationDate) <= 7 ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>{meta.detail}</span>
      </span>
      <span className={cn('font-medium tabular-nums', employee.daysRemaining <= 7 && 'text-rose-600 dark:text-rose-300')}>{employee.daysRemaining} days</span>
      <span>
        <span className="block text-xs text-muted-foreground">Evaluation {employee.evaluationNumber}</span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${employee.progressPercent}%` }} />
        </span>
      </span>
      <span className="truncate">{employee.managerName || 'Manager not assigned'}</span>
      <Badge variant="outline" className={cn('w-fit whitespace-nowrap font-medium', meta.className)}>{meta.label}</Badge>
    </button>
  );
}
