"use client";

import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ContractEmployeeWithExpiry } from './contract-monitoring-types';
import { ContractEmployeeIdentity } from './ContractMonitoringParts';
import { ContractDetailPanel } from './ContractTableView';
import { displayType, formatShortDate } from './contract-monitoring-utils';

export function ContractWorkflowView({ contracts, selected, onSelect }: { contracts: ContractEmployeeWithExpiry[]; selected: ContractEmployeeWithExpiry | null; onSelect: (employee: ContractEmployeeWithExpiry | null) => void }) {
  const setup = contracts.filter(contract => contract.expiry.state === 'missing_end_date');
  const review = contracts.filter(contract => ['due', 'expired'].includes(contract.expiry.state));
  const healthy = contracts.filter(contract => contract.expiry.state === 'scheduled');
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-background p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm"><strong>{review.length} contracts need a decision</strong><span className="text-border">•</span><span className="text-muted-foreground">{setup.length} records need an end date</span></div>
      <div className="grid min-w-[1120px] grid-cols-[0.9fr_1.15fr_1fr] gap-2">
        <WorkflowLane title="Needs setup" count={setup.length} contracts={setup} selected={selected} onSelect={onSelect} tone="setup" />
        <WorkflowLane title="Review & decide" count={review.length} contracts={review} selected={selected} onSelect={onSelect} tone="review" />
        <WorkflowLane title="Scheduled / healthy" count={healthy.length} contracts={healthy} selected={selected} onSelect={onSelect} tone="healthy" />
      </div>
      <Sheet open={Boolean(selected)} onOpenChange={open => { if (!open) onSelect(null); }}>
        {selected && <ContractDetailPanel employee={selected} onClose={() => onSelect(null)} />}
      </Sheet>
    </div>
  );
}

function WorkflowLane({ title, count, contracts, selected, onSelect, tone }: { title: string; count: number; contracts: ContractEmployeeWithExpiry[]; selected: ContractEmployeeWithExpiry | null; onSelect: (employee: ContractEmployeeWithExpiry) => void; tone: 'setup' | 'review' | 'healthy' }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <header className="flex h-11 items-center gap-2 border-b border-border px-4 text-xs font-semibold"><span className={cn('h-2.5 w-2.5 rounded-full', tone === 'setup' && 'bg-amber-400', tone === 'review' && 'bg-orange-400', tone === 'healthy' && 'bg-emerald-400')} /><span>{title}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{count}</span></header>
      <div className="grid grid-cols-[minmax(150px,1.4fr)_0.8fr_0.8fr_0.55fr] border-b border-border bg-muted/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground"><span>Worker</span><span>Type / client</span><span>End date</span><span className="text-right">Action</span></div>
      <div className="divide-y divide-border">
        {contracts.slice(0, 10).map(employee => (
          <button key={employee.id} type="button" onClick={() => onSelect(employee)} className={cn('grid w-full grid-cols-[minmax(150px,1.4fr)_0.8fr_0.8fr_0.55fr] items-center gap-2 px-3 py-3 text-left text-xs hover:bg-muted/35', selected?.id === employee.id && 'bg-primary/10 hover:bg-primary/10')}>
            <ContractEmployeeIdentity employee={employee} compact />
            <div className="min-w-0"><p className="truncate font-medium">{displayType(employee.employmentType)}</p><p className="truncate text-[10px] text-muted-foreground">{employee.clientName || employee.departmentName || '—'}</p></div>
            <div><p className={cn('font-semibold', employee.expiry.state === 'expired' && 'text-red-600 dark:text-red-300', employee.expiry.state === 'due' && 'text-amber-600 dark:text-amber-300', employee.expiry.state === 'scheduled' && 'text-emerald-600 dark:text-emerald-300')}>{formatShortDate(employee.endDate)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{employee.expiry.daysRemaining === null ? 'Required' : `${employee.expiry.daysRemaining} days`}</p></div>
            <span className="text-right text-[11px] font-semibold text-primary">{tone === 'setup' ? 'Set date' : tone === 'review' ? 'Review' : 'Open'}</span>
          </button>
        ))}
        {contracts.length === 0 && <p className="px-4 py-10 text-center text-xs text-muted-foreground">No contracts in this stage.</p>}
      </div>
    </section>
  );
}
