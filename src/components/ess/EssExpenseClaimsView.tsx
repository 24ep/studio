'use client';

import * as React from 'react';
import { Paperclip, Plus, RefreshCw, Search, X } from 'lucide-react';

import { ExpenseCreateForm } from '@/components/expenses/ExpenseCreateForm';
import { ExpenseStatusBadge, MoneyDisplay, PolicyWarningPanel } from '@/components/expenses/ExpensePrimitives';
import { Button } from '@/components/ui/button';
import type { ExpenseRecord, ExpenseSummary } from '@/lib/expenses/contracts';
import { employeeExpenseActions, employeeExpenseQuery, type EmployeeExpenseAction } from './ess-expense';

const emptySummary: ExpenseSummary = {
  primaryAmount: 0,
  primaryLabel: 'Claimed',
  currency: null,
  drafts: 0,
  pending: 0,
  attention: 0,
  completed: 0,
  records: [],
  categories: [],
  advanceTypes: [],
  access: { canCreate: false, canApprove: false, canFinance: false, canAudit: false, scope: 'self' },
};

export function EssExpenseClaimsView() {
  const [summary, setSummary] = React.useState<ExpenseSummary>(emptySummary);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<ExpenseRecord | null>(null);
  const [busy, setBusy] = React.useState(false);
  const deferredSearch = React.useDeferredValue(search);

  const load = React.useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/expenses/claims?${employeeExpenseQuery({ search: deferredSearch, status })}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await response.json() as { data?: ExpenseSummary; message?: string };
      if (!response.ok || !body.data) throw new Error(body.message || 'Unable to load your expense claims.');
      setSummary({
        ...body.data,
        access: { ...body.data.access, canApprove: false, canFinance: false, canAudit: false, scope: 'self' },
      });
      setSelected(current => current ? body.data?.records.find(record => record.id === current.id) || null : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your expense claims.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deferredSearch, status]);

  React.useEffect(() => { void load(); }, [load]);

  async function performAction(action: EmployeeExpenseAction) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/expenses/claims', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          action,
          expectedVersion: selected.version,
          idempotencyKey: `ess-${action}-${selected.id}-${crypto.randomUUID()}`,
        }),
      });
      const body = await response.json() as { data?: ExpenseRecord; message?: string };
      if (!response.ok) throw new Error(body.message || 'Unable to update this expense claim.');
      setMessage(action === 'submit' ? 'Expense claim submitted for review.' : action === 'withdraw' ? 'Expense claim withdrawn.' : 'Expense claim resubmitted for review.');
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Unable to update this expense claim.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadReceipt(file: File) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set('claimId', selected.id);
    form.set('file', file);
    try {
      const response = await fetch('/api/expenses/receipts', { method: 'POST', credentials: 'include', body: form });
      const body = await response.json() as { message?: string; duplicateWarning?: string };
      if (!response.ok) throw new Error(body.message || 'Unable to upload this receipt.');
      setMessage(body.duplicateWarning || 'Receipt uploaded securely.');
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Unable to upload this receipt.');
    } finally {
      setBusy(false);
    }
  }

  const statuses = Array.from(new Set(summary.records.map(record => record.status))).sort();
  const selectedActions = selected ? employeeExpenseActions(selected.status) : [];

  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Employee self-service</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">My expense claims</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create claims, attach receipts, respond to review, and track reimbursement through payment.</p>
          </div>
          {summary.access.canCreate && (
            <Button className="min-h-11" onClick={() => { setCreating(true); setSelected(null); }}>
              <Plus className="mr-2 h-4 w-4" /> New claim
            </Button>
          )}
        </header>

        {creating && (
          <ExpenseCreateForm
            resource="claims"
            summary={summary}
            onClose={() => setCreating(false)}
            onCreated={() => { setCreating(false); setMessage('Expense claim created.'); void load(true); }}
          />
        )}

        {message && <div role="status" className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div>}
        {error && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
          </div>
        )}

        <section className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 lg:grid-cols-5" aria-label="Expense claim summary">
          <SummaryCell label={summary.primaryLabel} value={<MoneyDisplay amount={summary.primaryAmount} currency={summary.currency} />} />
          <SummaryCell label="Drafts" value={summary.drafts} />
          <SummaryCell label="In review" value={summary.pending} />
          <SummaryCell label="Needs attention" value={summary.attention} />
          <SummaryCell label="Completed" value={summary.completed} />
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="min-h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search claim reference or title" />
            </label>
            <select className="min-h-11 rounded-md border border-input bg-background px-3 text-sm" aria-label="Filter expense claims by status" value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {statuses.map(value => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}
            </select>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Refresh expense claims" onClick={() => void load(true)}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading your expense claims…</div>
          ) : summary.records.length === 0 ? (
            <div className="p-10 text-center"><p className="font-semibold">No expense claims yet</p><p className="mt-1 text-sm text-muted-foreground">Create a claim when you need reimbursement for a business expense.</p></div>
          ) : (
            <div className={`grid ${selected ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : ''}`}>
              <div className="divide-y divide-border">
                {summary.records.map(record => (
                  <button key={record.id} type="button" onClick={() => setSelected(record)} className="flex min-h-20 w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/30">
                    <div className="min-w-0"><p className="text-xs font-semibold text-primary">{record.reference}</p><p className="truncate font-medium">{record.title}</p><p className="mt-1 text-xs text-muted-foreground">Updated {new Date(record.updatedAt).toLocaleDateString()}</p></div>
                    <div className="flex shrink-0 items-center gap-3"><ExpenseStatusBadge status={record.status} /><MoneyDisplay amount={record.amount} currency={record.currency} className="font-semibold" /></div>
                  </button>
                ))}
              </div>

              {selected && (
                <aside className="border-t border-border bg-muted/10 p-4 lg:border-l lg:border-t-0" aria-label={`${selected.reference} details`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-semibold text-primary">{selected.reference}</p><h2 className="mt-1 text-lg font-semibold">{selected.title}</h2></div>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Close expense claim details"><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3"><ExpenseStatusBadge status={selected.status} /><MoneyDisplay amount={selected.amount} currency={selected.currency} className="text-lg font-semibold" /></div>
                  <div className="mt-4"><PolicyWarningPanel results={selected.policyResults || []} /></div>

                  {['draft', 'returned_for_revision'].includes(selected.status) && (
                    <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input px-3 text-sm font-medium hover:bg-muted/30">
                      <Paperclip className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload receipt or PDF'}
                      <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void uploadReceipt(file); }} />
                    </label>
                  )}

                  {selectedActions.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {selectedActions.map(action => (
                        <Button key={action} variant={action === 'withdraw' ? 'outline' : 'default'} className="min-h-11 capitalize" disabled={busy} onClick={() => void performAction(action)}>
                          {action === 'submit' ? 'Submit for review' : action === 'resubmit' ? 'Resubmit for review' : 'Withdraw claim'}
                        </Button>
                      ))}
                    </div>
                  )}

                  {['approved', 'reimbursement_processing', 'paid', 'closed'].includes(selected.status) && (
                    <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm">
                      <p className="font-medium">Reimbursement status</p>
                      <p className="mt-1 text-muted-foreground">{selected.status === 'paid' || selected.status === 'closed' ? 'Payment completed.' : selected.status === 'reimbursement_processing' ? 'Payment is being processed.' : 'Approved and waiting for payment processing.'}</p>
                    </div>
                  )}
                </aside>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCell({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="border-b border-border px-4 py-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="mt-1 text-xl font-semibold tabular-nums">{value}</div></div>;
}
