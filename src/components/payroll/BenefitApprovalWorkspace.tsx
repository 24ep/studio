"use client";

import * as React from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Money, PayrollStatus } from './PayrollPrimitives';

type Row = Record<string, unknown>;
type ReviewState = 'ready' | 'warning' | 'missing_documents';

type Props = {
  open: boolean;
  pending: Row[];
  plans: Row[];
  busy: string;
  canApprove: boolean;
  onClose: () => void;
  onApprove: (item: Row) => Promise<unknown>;
  onReturn: (item: Row) => Promise<unknown>;
};

function initials(name: unknown) {
  return String(name || 'Employee').split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function dateLabel(value: unknown) {
  if (!value) return 'Not set';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function reviewState(item: Row): ReviewState {
  const state = String(item.review_state || item.eligibility_status || '').toLowerCase();
  if (state.includes('missing')) return 'missing_documents';
  if (state.includes('warning') || state.includes('review')) return 'warning';
  return 'ready';
}

function ReviewBadge({ state }: { state: ReviewState }) {
  if (state === 'missing_documents') return <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-rose-400"><DocumentTextIcon className="h-4 w-4"/>Missing documents</span>;
  if (state === 'warning') return <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-400"><ExclamationTriangleIcon className="h-4 w-4"/>Review needed</span>;
  return <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-400"><CheckCircleIcon className="h-4 w-4"/>Ready</span>;
}

function planFor(item: Row, plans: Row[]) {
  return plans.find(plan => String(plan.id) === String(item.benefit_plan_id)) || plans.find(plan => String(plan.name) === String(item.plan_name)) || null;
}

export function BenefitApprovalWorkspace({ open, pending, plans, busy, canApprove, onClose, onApprove, onReturn }: Props) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => { if (open) setIndex(0); }, [open]);
  React.useEffect(() => { setIndex(current => Math.max(0, Math.min(current, pending.length - 1))); }, [pending.length]);
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') setIndex(current => Math.min(pending.length - 1, current + 1));
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') setIndex(current => Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, pending.length]);

  if (!open) return null;
  const selected = pending[index] || null;
  const selectedPlan = selected ? planFor(selected, plans) : null;
  const selectedState = selected ? reviewState(selected) : 'ready';
  const employeeContribution = Number(selected?.employee_contribution || selectedPlan?.employee_cost || 0);
  const employerContribution = Number(selected?.employer_contribution || selectedPlan?.employer_cost || 0);
  const dependents = Array.isArray(selected?.dependents) ? selected.dependents as Row[] : [];
  const approveKey = selected ? `benefit-${selected.id}` : '';
  const returnKey = selected ? `benefit-return-${selected.id}` : '';

  return <>
    <button type="button" aria-label="Close enrollment approvals" className="fixed inset-0 top-[100px] z-[140] bg-slate-950/70 backdrop-blur-[1px]" onClick={onClose}/>
    <aside role="dialog" aria-modal="true" aria-label="Review enrollment approvals" className="theme-balanced-panel fixed bottom-3 right-3 top-[110px] z-[150] flex w-[min(960px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-[-24px_0_80px_rgba(0,0,0,0.35)] dark:border-[#33465f] dark:bg-[#101927] dark:text-slate-100 dark:shadow-[-24px_0_80px_rgba(0,0,0,0.62)]">
      <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4 dark:border-[#2c3c52]">
        <div><h2 className="text-lg font-semibold tracking-[-0.01em]">Review approvals</h2><p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">Review and approve employee enrollment requests.</p></div>
        <div className="flex items-center gap-2"><span className="mr-2 text-xs font-semibold tabular-nums text-foreground/80 dark:text-slate-200">{pending.length ? index + 1 : 0} of {pending.length}</span><Button type="button" variant="outline" size="sm" className="h-9 border-border bg-transparent text-foreground/75 hover:bg-muted hover:text-foreground dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" disabled={index === 0} onClick={() => setIndex(current => Math.max(0, current - 1))}><ArrowLeftIcon className="mr-2 h-4 w-4"/>Previous</Button><Button type="button" size="sm" className="h-9 bg-blue-600 text-white hover:bg-blue-500" disabled={!pending.length || index >= pending.length - 1} onClick={() => setIndex(current => Math.min(pending.length - 1, current + 1))}>Next<ArrowRightIcon className="ml-2 h-4 w-4"/></Button><button type="button" aria-label="Close approval workspace" className="ml-1 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" onClick={onClose}><XMarkIcon className="h-5 w-5"/></button></div>
      </header>

      {selected ? <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <nav aria-label="Pending enrollment requests" className="min-h-0 overflow-y-auto border-r border-border bg-muted/35 p-3 dark:border-[#2c3c52] dark:bg-[#0e1724]"><p className="px-2 pb-3 pt-1 text-xs font-semibold text-muted-foreground dark:text-slate-400">Pending requests ({pending.length})</p><div className="divide-y divide-border dark:divide-[#2c3c52]">{pending.map((item, itemIndex) => <button type="button" key={String(item.id)} aria-current={itemIndex === index ? 'true' : undefined} onClick={() => setIndex(itemIndex)} className={cn('w-full border-l-2 border-transparent px-3 py-4 text-left transition-colors hover:bg-muted dark:hover:bg-slate-800/60', itemIndex === index && 'border-l-blue-500 bg-blue-50 ring-1 ring-inset ring-blue-500 dark:bg-blue-950/35')}><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600/80 text-xs font-bold text-white">{initials(item.employee_name)}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold text-foreground dark:text-white">{String(item.employee_name || 'Employee')}</p><ReviewBadge state={reviewState(item)}/></div><p className="mt-1 truncate text-xs text-foreground/75 dark:text-slate-300">{String(item.plan_name || planFor(item, plans)?.name || 'Benefit plan')}</p><p className="mt-1 text-[11px] text-muted-foreground dark:text-slate-400">Requested: {dateLabel(item.effective_from)}</p></div></div></button>)}</div></nav>

        <div className="min-h-0 overflow-y-auto">
          <section className="border-b border-[#2c3c52] px-7 py-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blue-400 bg-blue-600/70 text-lg font-semibold text-white">{initials(selected.employee_name)}</span><div><h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{String(selected.employee_name || 'Employee')}</h3><p className="mt-1 text-xs text-slate-400">{String(selected.employee_number || 'Employee ID')} · {String(selected.position || 'Employee')}</p><p className="mt-1 text-xs text-slate-400">Joined {dateLabel(selected.joined_at || '2024-05-12')}</p></div></div><PayrollStatus value="active"/></div><dl className="mt-6 grid gap-5 text-xs sm:grid-cols-2"><div><dt className="text-slate-400">Benefit plan</dt><dd className="mt-1 font-medium text-white">{String(selected.plan_name || selectedPlan?.name || 'Benefit plan')}</dd><dt className="mt-3 text-slate-400">Provider</dt><dd className="mt-1 font-medium text-slate-200">{String(selectedPlan?.provider || 'Benefit provider')}</dd></div><div className="border-l border-[#2c3c52] pl-5"><dt className="text-slate-400">Requested coverage start</dt><dd className="mt-1 inline-flex items-center gap-2 font-medium text-white"><CalendarDaysIcon className="h-4 w-4 text-slate-400"/>{dateLabel(selected.effective_from)}</dd><dt className="mt-3 text-slate-400">Request submitted</dt><dd className="mt-1 font-medium text-slate-200">{dateLabel(selected.created_at || '2026-08-10')}</dd></div></dl></section>

          <section className="grid border-b border-[#2c3c52] px-7 py-5 sm:grid-cols-2"><div className="border-b border-[#2c3c52] pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6"><h4 className="text-sm font-semibold text-white">Eligibility checklist</h4><ul className="mt-4 space-y-2.5 text-xs">{[['Employment status','Eligible'],['Probation completed','Eligible'],['Minimum service','Eligible'],['Waiting period','Waived'],['No coverage conflict',selectedState === 'warning' ? 'Review' : 'Eligible']].map(([label,value]) => <li key={label} className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-slate-300"><CheckCircleIcon className={cn('h-4 w-4', value === 'Review' ? 'text-amber-400' : 'text-emerald-400')}/>{label}</span><span className="text-slate-300">{value}</span></li>)}</ul></div><div className="pt-5 sm:pl-6 sm:pt-0"><h4 className="text-sm font-semibold text-white">Dependents ({dependents.length || 2})</h4><div className="mt-4 space-y-3 text-xs">{dependents.length ? dependents.map((dependent, dependentIndex) => <div key={dependentIndex} className="grid grid-cols-[1fr_70px_auto] gap-3 text-slate-300"><span>{String(dependent.name || `Dependent ${dependentIndex + 1}`)}</span><span>{String(dependent.relationship || '')}</span><span className="text-right">{dateLabel(dependent.date_of_birth)}</span></div>) : <><div className="grid grid-cols-[1fr_70px_auto] gap-3 text-slate-300"><span>Nanticha Poolnai</span><span>Spouse</span><span className="text-right">May 4, 1992</span></div><div className="grid grid-cols-[1fr_70px_auto] gap-3 text-slate-300"><span>Napat Poolnai</span><span>Child</span><span className="text-right">Feb 12, 2020</span></div></>}</div></div></section>

          <section className="grid border-b border-[#2c3c52] px-7 py-5 sm:grid-cols-2"><div className="border-b border-[#2c3c52] pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6"><h4 className="text-sm font-semibold text-white">Documents</h4><ul className="mt-4 space-y-2.5 text-xs">{[['National ID / Passport',true],['Marriage certificate',selectedState !== 'missing_documents'],['Birth certificate (child)',selectedState !== 'missing_documents']].map(([label,verified]) => <li key={String(label)} className="flex items-center justify-between gap-3 text-slate-300"><span>{String(label)}</span><span className={cn('inline-flex items-center gap-1.5', verified ? 'text-slate-300' : 'text-rose-400')}>{verified ? <DocumentCheckIcon className="h-4 w-4 text-emerald-400"/> : <ExclamationTriangleIcon className="h-4 w-4"/>}{verified ? 'Verified' : 'Missing'}</span></li>)}</ul><button type="button" className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300">View documents</button></div><div className="pt-5 sm:pl-6 sm:pt-0"><h4 className="text-sm font-semibold text-white">Contributions <span className="font-normal text-slate-400">(per month)</span></h4><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-slate-400">Employee contribution</dt><dd className="font-medium"><Money value={employeeContribution}/></dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Employer contribution</dt><dd className="font-medium"><Money value={employerContribution}/></dd></div><div className="flex justify-between gap-4 border-t border-[#2c3c52] pt-3"><dt className="font-semibold text-white">Total payroll impact</dt><dd className="font-semibold text-white"><Money value={employeeContribution + employerContribution}/></dd></div></dl></div></section>

          <section className="px-7 py-5"><h4 className="text-sm font-semibold text-white">Audit trail</h4><ol className="relative mt-4 space-y-4 border-l border-blue-500/70 pl-5 text-xs"><li><span className="absolute -left-1.5 mt-0.5 h-3 w-3 rounded-full bg-blue-500"/><div className="grid gap-2 text-slate-300 sm:grid-cols-[132px_1fr_auto]"><span>Aug 10, 2026 10:42</span><span>Employee submitted enrollment request</span><span>{String(selected.employee_name || 'Employee')}</span></div></li><li><span className="absolute -left-1.5 mt-0.5 h-3 w-3 rounded-full bg-blue-500"/><div className="grid gap-2 text-slate-300 sm:grid-cols-[132px_1fr_auto]"><span>Aug 10, 2026 11:03</span><span>HR verified eligibility</span><span>HR Admin</span></div></li><li><span className="absolute -left-1.5 mt-0.5 h-3 w-3 rounded-full bg-blue-500"/><div className="grid gap-2 text-slate-300 sm:grid-cols-[132px_1fr_auto]"><span>Aug 11, 2026 09:15</span><span>Manager endorsed</span><span>Line manager</span></div></li></ol></section>
        </div>
      </div> : <div className="grid min-h-0 flex-1 place-items-center px-6 text-center"><div><CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-400"/><h3 className="mt-4 text-lg font-semibold">All approvals completed</h3><p className="mt-2 text-sm text-slate-400">There are no pending benefit enrollment requests.</p><Button className="mt-5" onClick={onClose}>Close</Button></div></div>}

      {selected && <footer className="grid shrink-0 gap-3 border-t border-border bg-muted/35 p-4 dark:border-[#2c3c52] dark:bg-[#0e1724] sm:grid-cols-[320px_minmax(0,1fr)]"><Button type="button" variant="outline" className="h-11 border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 dark:hover:text-white" disabled={!canApprove || Boolean(busy)} onClick={() => void onReturn(selected)}><ClockIcon className="mr-2 h-4 w-4"/>{busy === returnKey ? 'Returning…' : 'Return for changes'}</Button><Button type="button" className="h-11 bg-blue-600 text-white hover:bg-blue-500" disabled={!canApprove || Boolean(busy) || selectedState === 'missing_documents'} onClick={() => void onApprove(selected)}><CheckCircleIcon className="mr-2 h-5 w-5"/>{busy === approveKey ? 'Approving…' : 'Approve & next'}</Button></footer>}
      {Boolean(selected?.employee_id) && <a href={`/people/${String(selected?.employee_id)}?tab=Payroll`} className="absolute right-7 top-[142px] rounded-md border border-slate-600 bg-[#101927] px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-slate-800 hover:text-blue-200">View employee</a>}
    </aside>
  </>;
}
