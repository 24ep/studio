'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PlusIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import type { ExpenseActionInput, ExpenseRecord, ExpenseResource, ExpenseSummary } from '@/lib/expenses/contracts';
import { HrisWorkspaceHeader } from '@/components/hris/HrisWorkspacePrimitives';
import { cn } from '@/lib/utils';
import { ExpenseCreateForm } from './ExpenseCreateForm';
import {
  ExpenseEmpty,
  ExpenseError,
  ExpenseSkeleton,
  ExpenseStatusBadge,
  MoneyDisplay,
  PolicyWarningPanel,
} from './ExpensePrimitives';

const workspaceConfig = {
  advances: {
    title: 'Employee Advance',
    eyebrow: 'Funds before spend',
    description: 'Request, receive, use, and settle business advances with a complete balance history.',
    singular: 'advance',
    icon: BanknotesIcon,
  },
  claims: {
    title: 'Expense Claim',
    eyebrow: 'Spend to reimbursement',
    description: 'Capture expenses, attach evidence, resolve policy checks, and track reimbursement.',
    singular: 'claim',
    icon: ReceiptPercentIcon,
  },
  travel: {
    title: 'Travel',
    eyebrow: 'Plan to settlement',
    description: 'Plan approved business travel, connect advances, and close every trip with a claim.',
    singular: 'travel request',
    icon: CalendarDaysIcon,
  },
  accounting: {
    title: 'Accounting Entries',
    eyebrow: 'Finance control',
    description: 'Validate source transactions, generate balanced journals, post, reverse, and reconcile.',
    singular: 'journal',
    icon: DocumentTextIcon,
  },
} as const;

const emptySummary: ExpenseSummary = {
  primaryAmount: 0,
  primaryLabel: 'Total',
  currency: null,
  drafts: 0,
  pending: 0,
  attention: 0,
  completed: 0,
  records: [],
  categories: [],
  advanceTypes: [],
  access: {
    canCreate: false,
    canApprove: false,
    canFinance: false,
    canAudit: false,
    scope: 'self',
  },
};

function actionOptions(resource: ExpenseResource, record: ExpenseRecord, summary: ExpenseSummary) {
  const actions: Array<{ action: ExpenseActionInput['action']; label: string; tone?: 'primary' | 'danger' }> = [];
  if (resource === 'accounting') {
    if (['pending_generation', 'validation_failed', 'posting_failed'].includes(record.status)) actions.push({ action: 'generate_journal', label: record.status === 'posting_failed' ? 'Regenerate journal' : 'Generate journal', tone: 'primary' });
    if (record.status === 'ready_for_review') actions.push({ action: 'mark_ready_to_export', label: 'Mark ready to export', tone: 'primary' });
    if (record.status === 'ready_to_export') actions.push({ action: 'mark_exported', label: 'Record export', tone: 'primary' });
    if (record.status === 'exported') actions.push({ action: 'mark_posted', label: 'Record successful posting', tone: 'primary' }, { action: 'mark_posting_failed', label: 'Record posting failure', tone: 'danger' });
    if (record.status === 'posted') actions.push({ action: 'reconcile', label: 'Reconcile journal', tone: 'primary' }, { action: 'reverse', label: 'Create reversal', tone: 'danger' });
    if (record.status === 'reconciled') actions.push({ action: 'close', label: 'Close journal', tone: 'primary' });
    return summary.access.canFinance ? actions : [];
  }
  if (record.status === 'draft') actions.push({ action: 'submit', label: 'Send for review', tone: 'primary' });
  if (record.status === 'returned_for_revision' || record.status === 'withdrawn') actions.push({ action: 'resubmit', label: 'Resend for review', tone: 'primary' });
  if (record.status.startsWith('pending_')) {
    actions.push({ action: 'withdraw', label: 'Withdraw request' });
    if (summary.access.canApprove) {
      actions.push(
        { action: 'approve', label: 'Approve', tone: 'primary' },
        { action: 'return_for_revision', label: 'Return for revision' },
        { action: 'reject', label: 'Reject', tone: 'danger' },
      );
    }
  }
  if (summary.access.canFinance && record.status === 'approved') actions.push({ action: 'mark_payment_processing', label: 'Start payment', tone: 'primary' });
  if (summary.access.canFinance && ['payment_processing', 'reimbursement_processing'].includes(record.status)) actions.push({ action: 'mark_paid', label: 'Record payment', tone: 'primary' });
  if (resource === 'advances' && ['paid', 'partially_settled', 'overdue'].includes(record.status)) actions.push({ action: 'settle', label: 'Record settlement', tone: 'primary' });
  return actions;
}

export function ExpensesWorkspace({ resource }: { resource: ExpenseResource }) {
  const config = workspaceConfig[resource];
  const Icon = config.icon;
  const [summary, setSummary] = React.useState<ExpenseSummary>(emptySummary);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [scope, setScope] = React.useState<'self' | 'team' | 'finance'>('self');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<ExpenseRecord | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const searchDeferred = React.useDeferredValue(search);

  const load = React.useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    const params = new URLSearchParams({ scope, pageSize: '50' });
    if (searchDeferred.trim()) params.set('search', searchDeferred.trim());
    if (status) params.set('status', status);
    try {
      const response = await fetch(`/api/expenses/${resource}?${params}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'The expense workspace could not be loaded.');
      setSummary(body.data);
      setSelected(current => current
        ? body.data.records.find((record: ExpenseRecord) => record.id === current.id) || null
        : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The expense workspace could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resource, scope, searchDeferred, status]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function performAction(action: ExpenseActionInput['action']) {
    if (!selected) return;
    let comment: string | null = null;
    if (['reject', 'return_for_revision', 'mark_posting_failed', 'reverse', 'reconcile'].includes(action)) {
      comment = window.prompt(action === 'reconcile' ? 'Add reconciliation notes' : 'Explain this decision');
      if (!comment?.trim()) return;
    }
    let settlementAmount: number | undefined;
    if (action === 'settle') {
      const value = window.prompt('Settlement amount');
      if (!value) return;
      settlementAmount = Number(value);
      if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
        setMessage('Enter a settlement amount greater than zero.');
        return;
      }
    }
    let reference: string | null = null;
    if (['mark_paid', 'mark_exported', 'mark_posted'].includes(action)) {
      reference = window.prompt(action === 'mark_paid' ? 'Payment reference' : 'External reference');
      if (!reference?.trim()) return;
    }
    setActionBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/expenses/${resource}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          action,
          comment,
          expectedVersion: selected.version,
          settlementAmount,
          paymentReference: action === 'mark_paid' ? reference : undefined,
          externalReference: ['mark_exported', 'mark_posted'].includes(action) ? reference : undefined,
          idempotencyKey: `${action}-${selected.id}-${crypto.randomUUID()}`,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'The action could not be completed.');
      setMessage(`${selected.reference} is now ${String(body.data.status).replace(/_/g, ' ')}.`);
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'The action could not be completed.');
    } finally {
      setActionBusy(false);
    }
  }

  async function uploadReceipt(file: File) {
    if (!selected) return;
    setActionBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set('claimId', selected.id);
    form.set('file', file);
    try {
      const response = await fetch('/api/expenses/receipts', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'The receipt could not be uploaded.');
      setMessage(body.duplicateWarning || 'Receipt uploaded securely.');
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'The receipt could not be uploaded.');
    } finally {
      setActionBusy(false);
    }
  }

  const availableStatuses = React.useMemo(() => (
    Array.from(new Set(summary.records.map(record => record.status))).sort()
  ), [summary.records]);
  const actions = selected ? actionOptions(resource, selected, summary) : [];

  return (
    <main className="min-h-full bg-[#f6f7f9] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      {!online && (
        <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          You are offline. Existing data remains visible; financial actions will resume when your connection returns.
        </div>
      )}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <HrisWorkspaceHeader
            eyebrow={config.eyebrow}
            title={config.title}
            description={config.description}
            leading={<div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-950 text-blue-100 dark:bg-blue-200 dark:text-blue-950">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>}
            action={<>
            {(summary.access.canFinance || summary.access.canAudit) && (
              <Link
                href={`/api/expenses/reports?report=${resource}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Export current report
              </Link>
            )}
            {summary.access.canCreate && resource !== 'accounting' && (
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setSelected(null);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <PlusIcon className="h-4 w-4" />
                Create {config.singular}
              </button>
            )}
            </>}
          />
        </div>
      </div>

      {creating && resource !== 'accounting' && (
        <ExpenseCreateForm
          resource={resource}
          summary={summary}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setMessage('Request created successfully.');
            load(true);
          }}
        />
      )}

      {message && (
        <div role="status" className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-950 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <div className="mx-auto max-w-[1600px]">{message}</div>
        </div>
      )}

      <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6" aria-label={`${config.title} summary`}>
        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 sm:col-span-2 sm:border-r lg:border-b-0 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{summary.primaryLabel}</p>
            <MoneyDisplay amount={summary.primaryAmount} currency={summary.currency} className="mt-2 block text-2xl font-bold tracking-tight" />
          </div>
          {[
            ['Drafts', summary.drafts],
            ['In review', summary.pending],
            ['Needs attention', summary.attention],
            ['Completed', summary.completed],
          ].map(([label, value], index) => (
            <div key={String(label)} className={cn(
              'border-b border-slate-200 p-4 sm:border-r lg:border-b-0 dark:border-slate-800',
              index === 3 && 'sm:border-r-0 lg:border-r-0',
            )}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800" aria-label="Record scope">
              <button type="button" onClick={() => setScope('self')} className={cn('min-h-9 rounded-md px-3 text-sm font-semibold', scope === 'self' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300')}>My records</button>
              {summary.access.canApprove && <button type="button" onClick={() => setScope('team')} className={cn('min-h-9 rounded-md px-3 text-sm font-semibold', scope === 'team' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300')}>Team review</button>}
              {(summary.access.canFinance || summary.access.canAudit) && <button type="button" onClick={() => setScope('finance')} className={cn('min-h-9 rounded-md px-3 text-sm font-semibold', scope === 'finance' ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300')}>Finance scope</button>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 sm:w-72">
                <span className="sr-only">Search {config.title}</span>
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search reference or title" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium dark:border-slate-700 dark:bg-slate-950">
                <option value="">All statuses</option>
                {availableStatuses.map(value => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
              </select>
              <button type="button" aria-label="Refresh expense records" onClick={() => load(true)} className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <ArrowPathIcon className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {loading ? <ExpenseSkeleton /> : error ? (
            <ExpenseError message={error} onRetry={() => load()} />
          ) : summary.records.length === 0 ? (
            <ExpenseEmpty resourceLabel={config.singular} canCreate={summary.access.canCreate && resource !== 'accounting'} onCreate={() => setCreating(true)} />
          ) : (
            <div className={cn('grid', selected && 'xl:grid-cols-[minmax(0,1fr)_420px]')}>
              <div className={cn('min-w-0', selected && 'xl:border-r xl:border-slate-200 dark:xl:border-slate-800')}>
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-950">
                      <tr>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Request</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="w-12 px-2 py-3"><span className="sr-only">Open details</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {summary.records.map(record => (
                        <tr key={record.id} className={cn('transition hover:bg-slate-50 dark:hover:bg-slate-800/60', selected?.id === record.id && 'bg-blue-50 dark:bg-blue-950/40')}>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-800 dark:text-blue-300">{record.reference}</td>
                          <td className="max-w-xs px-4 py-3"><p className="truncate font-semibold">{record.title}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(record.updatedAt).toLocaleDateString()}</p></td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record.employeeName}</td>
                          <td className="px-4 py-3"><ExpenseStatusBadge status={record.status} /></td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold"><MoneyDisplay amount={record.amount} currency={record.currency} /></td>
                          <td className="px-2 py-3">
                            <button type="button" onClick={() => setSelected(record)} aria-label={`Open ${record.reference}`} className="grid min-h-10 min-w-10 place-items-center rounded-lg hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800">
                              <ChevronRightIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
                  {summary.records.map(record => (
                    <button key={record.id} type="button" onClick={() => setSelected(record)} className="block min-h-28 w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">{record.reference}</p>
                          <p className="mt-1 truncate font-bold">{record.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{record.employeeName}</p>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <ExpenseStatusBadge status={record.status} />
                        <MoneyDisplay amount={record.amount} currency={record.currency} className="font-bold" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selected && (
                <aside className="border-t border-slate-200 bg-slate-50/50 xl:border-t-0 dark:border-slate-800 dark:bg-slate-950/50" aria-label={`${selected.reference} details`}>
                  <div className="sticky top-0">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">{selected.reference}</p>
                        <h2 className="mt-1 text-lg font-bold">{selected.title}</h2>
                      </div>
                      <button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="grid min-h-10 min-w-10 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <ExpenseStatusBadge status={selected.status} />
                        <MoneyDisplay amount={selected.amount} currency={selected.currency} className="text-lg font-bold" />
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200 py-4 text-sm dark:border-slate-800">
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Employee</dt><dd className="mt-1 font-semibold">{selected.employeeName}</dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</dt><dd className="mt-1 font-semibold">{new Date(selected.updatedAt).toLocaleString()}</dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Version</dt><dd className="mt-1 font-semibold">{selected.version}</dd></div>
                        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Approved</dt><dd className="mt-1 font-semibold">{selected.approvedAmount === undefined ? 'Pending' : <MoneyDisplay amount={selected.approvedAmount} currency={selected.currency} />}</dd></div>
                      </dl>

                      {resource !== 'accounting' && <PolicyWarningPanel results={selected.policyResults || []} />}
                      {resource === 'accounting' && (
                        <div className="border-y border-slate-200 py-4 text-sm dark:border-slate-800">
                          <div className="flex items-center gap-2 font-bold"><ShieldCheckIcon className="h-4 w-4 text-blue-700" /> Journal controls</div>
                          <p className="mt-2 text-slate-600 dark:text-slate-300">
                            Debit and credit are validated before export. Posted financial fields are immutable and reversals create a linked journal.
                          </p>
                          {Boolean(selected.metadata?.postingError) && <p className="mt-3 text-rose-700 dark:text-rose-300">{String(selected.metadata?.postingError)}</p>}
                        </div>
                      )}

                      {resource === 'claims' && selected.status === 'draft' && (
                        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-400 px-4 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-950">
                          <PaperClipIcon className="h-4 w-4" />
                          {actionBusy ? 'Uploading receipt…' : 'Upload receipt or PDF'}
                          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={actionBusy} onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) uploadReceipt(file);
                          }} />
                        </label>
                      )}

                      {actions.length > 0 && (
                        <div className="grid gap-2">
                          {actions.map(option => (
                            <button
                              key={option.action}
                              type="button"
                              disabled={actionBusy || !online}
                              onClick={() => performAction(option.action)}
                              className={cn(
                                'min-h-11 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                option.tone === 'primary'
                                  ? 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800'
                                  : option.tone === 'danger'
                                    ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950'
                                    : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
                              )}
                            >
                              {actionBusy ? 'Processing financial action…' : option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
