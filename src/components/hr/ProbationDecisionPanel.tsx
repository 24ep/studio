"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SheetContent, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatProbationDate } from '@/lib/hr/probation';
import { cn } from '@/lib/utils';
import {
  daysUntil,
  employeeName,
  evaluationMeta,
  initials,
  type ProbationEmployee,
} from './ProbationPageModel';

export function ProbationDecisionPanel({
  employee,
  canManage,
  onDecisionRecorded,
  onClose,
}: {
  employee: ProbationEmployee;
  canManage: boolean;
  onDecisionRecorded: () => Promise<void>;
  onClose: () => void;
}) {
  const [panelState, setPanelState] = React.useState<'summary' | 'record' | 'complete'>('summary');
  const [outcome, setOutcome] = React.useState<'confirm' | 'extend' | 'end'>('confirm');
  const [rationale, setRationale] = React.useState('');
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const [showNextSteps, setShowNextSteps] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const nextDay = new Date(employee.probationEndDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    setPanelState('summary');
    setOutcome('confirm');
    setRationale(`${employee.firstName} has demonstrated strong performance, ownership, and collaboration throughout the probation period.`);
    setEffectiveDate(nextDay.toISOString().slice(0, 10));
    setShowNextSteps(true);
    setSaveError(null);
  }, [employee]);

  function selectOutcome(nextOutcome: typeof outcome) {
    setOutcome(nextOutcome);
    setSaveError(null);
    const nextDate = new Date(employee.probationEndDate);
    if (nextOutcome === 'extend') nextDate.setUTCDate(nextDate.getUTCDate() + 30);
    else if (nextOutcome === 'confirm') nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    setEffectiveDate(nextDate.toISOString().slice(0, 10));
  }

  async function recordDecision() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/hr/probation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, outcome, rationale, effectiveDate }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to record the probation decision.');
      setPanelState('complete');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to record the probation decision.');
    } finally {
      setIsSaving(false);
    }
  }

  const meta = evaluationMeta(employee);
  const evaluationTwoDate = new Date(employee.nextEvaluationDate);
  evaluationTwoDate.setUTCDate(evaluationTwoDate.getUTCDate() + employee.effectiveFrequencyDays);
  const showSecondEvaluation = evaluationTwoDate < new Date(employee.probationEndDate);
  const completedDecisionCopy = outcome === 'confirm'
    ? `${employee.firstName}'s employment has been confirmed`
    : outcome === 'extend'
      ? `${employee.firstName}'s probation has been extended`
      : `${employee.firstName}'s employment end decision has been recorded`;

  if (panelState === 'complete') {
    return (
      <ProbationDrawer employee={employee}>
        <aside className="flex h-full min-h-0 flex-col overflow-y-auto bg-muted/[0.08]">
          <DecisionEmployeeHeader employee={employee} onClose={onClose} />
          <div className="flex flex-1 flex-col p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircleIcon className="h-7 w-7" aria-hidden />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Decision recorded</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {completedDecisionCopy} effective {formatProbationDate(`${effectiveDate}T00:00:00.000Z`)}.
            </p>

            <div className="mt-7 border-y border-border/80">
              <NextStepRow label="Employee record updated" detail="The employment status and effective date are now current." state="complete" />
              <NextStepRow label="Employment event stored" detail="The rationale and decision are available in Operations history." state="complete" />
              <NextStepRow label="Communication and acknowledgment" detail="Schedule the conversation and record any follow-up documents." state="future" />
            </div>

            <div className="mt-auto grid gap-2 pt-8">
              <Button asChild><Link href={`/people/${employee.id}?tab=Probation`}>Open employee record</Link></Button>
              <Button type="button" variant="outline" onClick={() => { void onDecisionRecorded().finally(onClose); }}>Back to probation overview</Button>
            </div>
          </div>
        </aside>
      </ProbationDrawer>
    );
  }

  if (panelState === 'record') {
    const canSubmit = rationale.trim().length >= 20 && Boolean(effectiveDate);
    return (
      <ProbationDrawer employee={employee}>
        <aside className="flex h-full min-h-0 flex-col overflow-y-auto bg-muted/[0.08]">
          <DecisionEmployeeHeader employee={employee} onClose={onClose} />
          <form
            className="flex flex-1 flex-col"
            onSubmit={event => {
              event.preventDefault();
              if (canSubmit && !isSaving) void recordDecision();
            }}
          >
            <div className="flex-1 p-5">
              <h3 className="text-sm font-semibold">Record probation decision</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Select the outcome and provide a brief rationale.</p>

              <RadioGroup value={outcome} onValueChange={value => selectOutcome(value as typeof outcome)} className="mt-5 gap-0 border-y border-border/80">
                <DecisionChoice value="confirm" title="Confirm employment" description="Employee has met the expectations of the role." />
                <DecisionChoice value="extend" title="Extend probation" description="More time is needed to meet expectations." />
                <DecisionChoice value="end" title="End employment" description="Performance has not met the required standard." />
              </RadioGroup>

              <div className="mt-5 space-y-2">
                <Label htmlFor="probation-rationale">Manager rationale</Label>
                <Textarea
                  id="probation-rationale"
                  value={rationale}
                  onChange={event => setRationale(event.target.value)}
                  maxLength={300}
                  className="min-h-28 resize-none"
                />
                <p className="text-right text-xs tabular-nums text-muted-foreground">{rationale.length}/300</p>
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor="probation-effective-date">{outcome === 'extend' ? 'New probation end date' : 'Effective date'}</Label>
                <Input id="probation-effective-date" type="date" max={new Date().toISOString().slice(0, 10)} value={effectiveDate} onChange={event => setEffectiveDate(event.target.value)} />
              </div>

              {saveError ? <p role="alert" className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{saveError}</p> : null}

              <div className="mt-6">
                <h4 className="text-sm font-semibold">HR readiness</h4>
                <div className="mt-3 border-y border-border/80">
                  <ReadinessRow label="Required rationale entered" state={rationale.trim().length >= 20 ? 'complete' : 'pending'} />
                  <ReadinessRow label="Effective date selected" state={effectiveDate ? 'complete' : 'pending'} />
                  <ReadinessRow label="Decision not yet saved" state="pending" />
                </div>
              </div>

              <div className="mt-5 border-y border-border/80">
                <button type="button" className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold" onClick={() => setShowNextSteps(current => !current)} aria-expanded={showNextSteps}>
                  What happens next
                  <ChevronDownIcon className={cn('h-4 w-4 transition-transform', showNextSteps && 'rotate-180')} aria-hidden />
                </button>
                {showNextSteps ? (
                  <p className="border-t border-border/70 py-3 text-sm leading-6 text-muted-foreground">
                    Saving updates the employee record and creates an audited employment event. Communication and document follow-up remain visible next steps for People Operations.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-border/80 bg-background/95 p-5 backdrop-blur">
              <Button type="button" variant="outline" onClick={() => setPanelState('summary')} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit || isSaving}>{isSaving ? 'Recording…' : 'Confirm decision'}</Button>
            </div>
          </form>
        </aside>
      </ProbationDrawer>
    );
  }

  return (
    <ProbationDrawer employee={employee}>
      <aside className="h-full min-h-0 overflow-y-auto bg-muted/[0.08]">
        <DecisionEmployeeHeader employee={employee} onClose={onClose} />

        <div className="min-h-[260px] border-b border-border/80 p-5">
          <h3 className="text-sm font-semibold">Probation timeline</h3>
          <div className="mt-5 space-y-0">
            <TimelineItem label="Started" date={formatProbationDate(employee.probationStartDate)} state="complete" />
            <TimelineItem label={`Evaluation ${employee.evaluationNumber}`} date={`${formatProbationDate(employee.nextEvaluationDate)} · ${meta.detail}`} state={daysUntil(employee.nextEvaluationDate) < 0 ? 'overdue' : 'current'} />
            {showSecondEvaluation ? <TimelineItem label={`Evaluation ${employee.evaluationNumber + 1}`} date={formatProbationDate(evaluationTwoDate)} state="future" /> : null}
            <TimelineItem label="Confirmation decision" date={formatProbationDate(employee.probationEndDate)} state="future" last />
          </div>
        </div>

        <div className="min-h-[240px] border-b border-border/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Manager recommendation</h3>
            <Badge variant="outline" className="border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300">Review needed</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Review completed milestones and capture the manager’s recommendation before confirming probation.</p>
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{employee.managerName?.split(' ').map(part => part[0]).join('').slice(0, 2) || 'HR'}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium">{employee.managerName || 'Manager not assigned'}</p>
              <p className="text-xs text-muted-foreground">{employee.managerJobTitle || 'Line manager'}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold">Your actions</h3>
          <div className="mt-4 grid gap-2">
            {canManage ? <Button type="button" onClick={() => setPanelState('record')}>Record decision <ChevronRightIcon className="ml-auto h-4 w-4" aria-hidden /></Button> : <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">You have view-only access to probation records.</p>}
            <Button asChild variant="outline"><Link href={`/people/${employee.id}?tab=Probation`}>View profile</Link></Button>
          </div>
        </div>
      </aside>
    </ProbationDrawer>
  );
}

function ProbationDrawer({ employee, children }: { employee: ProbationEmployee; children: React.ReactNode }) {
  return (
    <SheetContent
      side="right"
      hideCloseButton
      sheetId="probation-detail-drawer"
      className="!bottom-4 !left-auto !right-4 !top-4 !h-[calc(100dvh-2rem)] !w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl sm:!max-w-[420px]"
    >
      <SheetDescription className="sr-only">
        Review the probation timeline and decision actions for {employeeName(employee)}.
      </SheetDescription>
      {children}
    </SheetContent>
  );
}

function DecisionEmployeeHeader({ employee, onClose }: { employee: ProbationEmployee; onClose: () => void }) {
  return (
    <div className="relative border-b border-border/80 px-5 pb-6 pt-14">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="h-14 w-14 shrink-0 rounded-full">
          {employee.profilePhotoUrl ? <AvatarImage src={employee.profilePhotoUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">{initials(employee)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{employeeName(employee)}</h2>
          <p className="text-xs text-muted-foreground">{employee.employeeNumber}</p>
          <p className="mt-1 truncate text-sm">{employee.positionTitle || 'Position not linked'}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose} aria-label="Close employee details">
        <XMarkIcon className="h-5 w-5" aria-hidden />
      </Button>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" aria-hidden />{employee.location || 'Location not set'}</span>
        <span className="flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4" aria-hidden />Started {formatProbationDate(employee.probationStartDate)}</span>
      </div>
    </div>
  );
}

function DecisionChoice({ value, title, description }: { value: string; title: string; description: string }) {
  return (
    <Label htmlFor={`probation-outcome-${value}`} className="flex cursor-pointer items-start gap-3 border-b border-border/70 py-3 last:border-b-0">
      <RadioGroupItem id={`probation-outcome-${value}`} value={value} className="mt-0.5 rounded-full" />
      <span>
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </Label>
  );
}

function ReadinessRow({ label, state }: { label: string; state: 'complete' | 'pending' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5 text-sm last:border-b-0">
      <span className="flex items-center gap-2">
        {state === 'complete' ? <CheckCircleIcon className="h-4 w-4 text-emerald-500" aria-hidden /> : <ClockIcon className="h-4 w-4 text-muted-foreground" aria-hidden />}
        {label}
      </span>
      <span className={cn('text-xs', state === 'complete' ? 'text-emerald-500' : 'text-muted-foreground')}>{state === 'complete' ? 'Complete' : 'Pending'}</span>
    </div>
  );
}

function NextStepRow({ label, detail, state }: { label: string; detail: string; state: 'complete' | 'current' | 'future' }) {
  return (
    <div className="flex gap-3 border-b border-border/70 py-4 last:border-b-0">
      {state === 'complete' ? <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden /> : <ClockIcon className={cn('mt-0.5 h-5 w-5 shrink-0', state === 'current' ? 'text-primary' : 'text-muted-foreground')} aria-hidden />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function TimelineItem({ label, date, state, last }: { label: string; date: string; state: 'complete' | 'current' | 'overdue' | 'future'; last?: boolean }) {
  const Icon = state === 'complete' ? CheckCircleIcon : state === 'overdue' ? ExclamationTriangleIcon : ClockIcon;
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {!last ? <span className="absolute bottom-0 left-[9px] top-5 w-px bg-border" aria-hidden /> : null}
      <Icon className={cn('relative z-10 h-5 w-5 shrink-0 bg-background', state === 'complete' && 'text-emerald-500', state === 'current' && 'text-primary', state === 'overdue' && 'text-rose-500', state === 'future' && 'text-muted-foreground')} aria-hidden />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}
