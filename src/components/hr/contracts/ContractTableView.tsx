"use client";

import Link from 'next/link';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ContractEmployeeWithExpiry } from './contract-monitoring-types';
import { ContractEmployeeIdentity, ContractStatePill } from './ContractMonitoringParts';
import { contractStateLabel, displayType, employeeName, formatShortDate } from './contract-monitoring-utils';

export function ContractTableView({ contracts, selected, onSelect }: { contracts: ContractEmployeeWithExpiry[]; selected: ContractEmployeeWithExpiry | null; onSelect: (employee: ContractEmployeeWithExpiry | null) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-auto">
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/75 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground backdrop-blur">
            <tr><th className="px-5 py-3">Employee</th><th className="px-4 py-3">Employment type</th><th className="px-4 py-3">Client / department</th><th className="px-4 py-3">Contract end</th><th className="px-4 py-3">Notice period</th><th className="px-4 py-3">Days remaining</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts.map(employee => (
              <tr key={employee.id} tabIndex={0} role="button" aria-label={`Review contract for ${employeeName(employee)}`} onClick={() => onSelect(employee)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(employee); } }} className={cn('cursor-pointer transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', selected?.id === employee.id && 'bg-primary/10 hover:bg-primary/10')}>
                <td className={cn('border-l-2 px-5 py-3', selected?.id === employee.id ? 'border-l-primary' : 'border-l-transparent')}><ContractEmployeeIdentity employee={employee} /></td>
                <td className="px-4 py-3 text-muted-foreground">{displayType(employee.employmentType)}</td>
                <td className="px-4 py-3"><p className="font-medium text-foreground">{employee.clientName || employee.departmentName || '—'}</p><p className="text-xs text-muted-foreground">{employee.clientName ? employee.departmentName : employee.location}</p></td>
                <td className="px-4 py-3 font-medium text-foreground">{formatShortDate(employee.endDate)}</td>
                <td className="px-4 py-3 text-muted-foreground">{employee.expiry.noticeDays || 30} days</td>
                <td className={cn('px-4 py-3 font-semibold tabular-nums', employee.expiry.state === 'expired' && 'text-red-600 dark:text-red-300', employee.expiry.state === 'due' && 'text-amber-600 dark:text-amber-300', employee.expiry.state === 'scheduled' && 'text-emerald-600 dark:text-emerald-300')}>{employee.expiry.daysRemaining === null ? '—' : employee.expiry.daysRemaining}</td>
                <td className="px-4 py-3"><p className="font-medium">{employee.owner}</p><p className="text-xs text-muted-foreground">HR owner</p></td>
                <td className="px-4 py-3"><ContractStatePill employee={employee} /></td>
                <td className="px-4 py-3 text-right"><span aria-hidden="true" className="inline-grid h-11 w-11 place-items-center rounded-md text-muted-foreground"><EllipsisHorizontalIcon className="h-5 w-5" /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {contracts.length === 0 && <div className="grid min-h-72 place-items-center p-8 text-center"><div><p className="font-semibold">No contract employees found</p><p className="mt-1 text-sm text-muted-foreground">Adjust the filters or add a contract end date to an employee record.</p></div></div>}
      </div>
      <Sheet open={Boolean(selected)} onOpenChange={open => { if (!open) onSelect(null); }}>
        {selected && <ContractDetailPanel employee={selected} onClose={() => onSelect(null)} />}
      </Sheet>
    </div>
  );
}

function DetailRow({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-4 py-1.5 text-xs"><dt className="text-muted-foreground">{label}</dt><dd className={cn('font-medium text-foreground', emphasis)}>{value}</dd></div>;
}

export function ContractDetailPanel({ employee, onClose }: { employee: ContractEmployeeWithExpiry; onClose: () => void }) {
  return (
    <SheetContent
      side="right"
      hideCloseButton
      sheetId="contract-detail-drawer"
      className="!inset-0 !h-dvh !w-screen overflow-hidden rounded-none border-border bg-card p-0 shadow-2xl sm:!bottom-4 sm:!left-auto sm:!right-4 sm:!top-4 sm:!h-[calc(100dvh-2rem)] sm:!w-[min(420px,calc(100vw-2rem))] sm:rounded-xl sm:!max-w-[420px]"
    >
      <SheetDescription className="sr-only">Review contract dates, ownership, documents, and actions for {employeeName(employee)}.</SheetDescription>
      <aside className="flex h-full min-h-0 flex-col" aria-label={`Contract details for ${employeeName(employee)}`}>
        <div className="flex shrink-0 items-start justify-between border-b border-border bg-card p-5 pr-3"><ContractEmployeeIdentity employee={employee} /><button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close details"><XMarkIcon className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <section><h2 className="text-sm font-semibold">Contract details</h2><dl className="mt-3"><DetailRow label="Employment" value={displayType(employee.employmentType)} /><DetailRow label="Client" value={employee.clientName || 'Not assigned'} /><DetailRow label="Department" value={employee.departmentName || 'Not assigned'} /><DetailRow label="Location" value={employee.location || 'Not set'} /><DetailRow label="Contract start" value={formatShortDate(employee.hireDate)} /><DetailRow label="Contract end" value={formatShortDate(employee.endDate)} /><DetailRow label="Notice period" value={`${employee.expiry.noticeDays || 30} days`} /><DetailRow label="Days remaining" value={contractStateLabel(employee)} emphasis={employee.expiry.state === 'expired' ? 'text-red-600 dark:text-red-300' : employee.expiry.state === 'due' ? 'text-amber-600 dark:text-amber-300' : ''} /></dl></section>
        <section className="border-t border-border pt-5"><h2 className="text-sm font-semibold">Manager</h2><p className="mt-2 text-sm font-medium">{employee.managerName || employee.owner}</p><p className="text-xs text-muted-foreground">Contract decision owner</p></section>
        <section className="border-t border-border pt-5"><h2 className="text-sm font-semibold">Document status</h2><div className="mt-3 space-y-3 text-xs"><p className="flex items-center gap-2"><CheckCircleIcon className={cn('h-4 w-4', employee.signedContractComplete ? 'text-emerald-500' : 'text-muted-foreground')} /> Signed contract <span className="ml-auto text-muted-foreground">{employee.signedContractComplete ? 'Complete' : 'Not complete'}</span></p><p className="flex items-center gap-2"><DocumentTextIcon className="h-4 w-4 text-primary" /> Supporting documents <span className="ml-auto text-muted-foreground">{employee.documentCount ? `${employee.completedDocumentCount} of ${employee.documentCount} complete (${employee.documentProgress}%)` : 'No documents'}</span></p></div></section>
        <section className="border-t border-border pt-5"><h2 className="text-sm font-semibold">Monitoring rule</h2><div className="mt-3 border-l border-border pl-4 text-xs"><p className="font-medium">Contract notice window</p><p className="mt-1 text-muted-foreground">Alerts become due {employee.expiry.noticeDays || 30} calendar days before the contract end date.</p></div></section>
        <div className="grid gap-2 border-t border-border pt-5"><Button asChild><Link href={`/people/${employee.id}?tab=Overview`}><PencilSquareIcon className="mr-2 h-4 w-4" />Open employment details</Link></Button><Button asChild variant="outline"><Link href={`/people/${employee.id}`}><EyeIcon className="mr-2 h-4 w-4" />View employee</Link></Button></div>
        </div>
      </aside>
    </SheetContent>
  );
}
