"use client";

import * as React from 'react';
import { FileClock, Pencil, RefreshCw, RotateCcw, Send, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApprovalTimeline, EmptyState, StatusBadge } from './EssShared';
import type { EssRow } from './ess-types';
import { dateValue, statusLabel, stringValue } from './ess-types';

type EditableType = 'profile_change' | 'document_request';
type OwnerAction = 'submit' | 'withdraw' | 'revise' | 'resubmit' | 'cancel';
type EditableDraft = {
  id: string;
  requestType: EditableType;
  title: string;
  reason: string;
  values: Record<string, unknown>;
  expectedVersion: number;
};

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function ownerActions(request: EssRow): OwnerAction[] {
  const status = String(request.status || '');
  if (status === 'draft') return ['submit'];
  if (status === 'pending_approval' || status === 'submitted') return ['withdraw'];
  if (status === 'returned_for_revision') return ['revise', 'resubmit', 'withdraw'];
  if (status === 'withdrawn') return ['resubmit'];
  if (status === 'approved' || status === 'processing') return ['cancel'];
  return [];
}

export function EssRequestCenter() {
  const [requests, setRequests] = React.useState<EssRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState('open');
  const [editing, setEditing] = React.useState<EditableDraft | null>(null);
  const [valuesText, setValuesText] = React.useState('{}');

  const load = React.useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    try {
      const response = await fetch('/api/ess/requests', { credentials: 'include', cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to load employee requests.');
      setRequests(body.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load employee requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const visible = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'needs_action') return ['draft', 'returned_for_revision'].includes(String(request.status));
    if (filter === 'open') return !['approved', 'rejected', 'cancelled', 'completed'].includes(String(request.status));
    return String(request.status) === filter;
  });
  const needsAction = requests.filter(request => ['draft', 'returned_for_revision'].includes(String(request.status))).length;

  async function act(request: EssRow, action: 'submit' | 'withdraw' | 'resubmit' | 'cancel') {
    const id = String(request.id || '');
    if (!id) return;
    setBusyId(id);
    try {
      const response = await fetch('/api/ess/requests', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, expectedVersion: request.version }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to update this request.');
      toast.success(action === 'resubmit' ? 'Request resubmitted.' : action === 'withdraw' ? 'Request withdrawn.' : action === 'cancel' ? 'Request cancelled.' : 'Request submitted.');
      await load(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update this request.');
    } finally {
      setBusyId(null);
    }
  }

  function beginRevision(request: EssRow) {
    const requestType = String(request.request_type) as EditableType;
    if (!['profile_change', 'document_request'].includes(requestType)) {
      toast.error('This request type uses its dedicated ESS editor.');
      return;
    }
    const values = objectValue(request.requested_values);
    setEditing({
      id: String(request.id),
      requestType,
      title: stringValue(request.title, 'Employee request'),
      reason: stringValue(request.reason, ''),
      values,
      expectedVersion: Number(request.version || 1),
    });
    setValuesText(JSON.stringify(values, null, 2));
  }

  async function saveRevision() {
    if (!editing) return;
    let values: Record<string, unknown>;
    try {
      const parsed = JSON.parse(valuesText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      values = parsed as Record<string, unknown>;
    } catch {
      toast.error('Requested values must be a valid JSON object.');
      return;
    }
    setBusyId(editing.id);
    try {
      const response = await fetch('/api/ess/requests', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, values }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Unable to save the revision.');
      toast.success('Revision saved. Review it and resubmit when ready.');
      setEditing(null);
      await load(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save the revision.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Employee self-service</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">My requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">Revise returned requests, resubmit them, and follow every approval through to its final state.</p>
          </div>
          <Button variant="outline" disabled={refreshing} onClick={() => void load(true)}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>
        </header>

        <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <Metric label="Needs your action" value={needsAction} />
          <Metric label="Open requests" value={requests.filter(item => !['approved', 'rejected', 'cancelled', 'completed'].includes(String(item.status))).length} />
          <Metric label="All history" value={requests.length} />
        </section>

        <div className="flex flex-wrap gap-2" aria-label="Request filters">
          {[
            ['open', 'Open'],
            ['needs_action', 'Needs action'],
            ['pending_approval', 'Pending'],
            ['approved', 'Approved'],
            ['all', 'All'],
          ].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{label}</Button>)}
        </div>

        {loading ? <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">Loading requests…</div> : visible.length === 0 ? <EmptyState title="No requests in this view" description="New requests and returned revisions will appear here." /> : (
          <section className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {visible.map(request => {
              const activity = Array.isArray(request.activity) ? request.activity as EssRow[] : [];
              const actions = ownerActions(request);
              const editable = ['profile_change', 'document_request'].includes(String(request.request_type));
              const id = String(request.id);
              return <article key={id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{stringValue(request.title, statusLabel(request.request_type))}</h2><StatusBadge status={request.status} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{stringValue(request.request_id)} · {statusLabel(request.request_type)} · {dateValue(request.created_at)}</p>
                    {Boolean(request.reason) && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{stringValue(request.reason)}</p>}
                    {String(request.status) === 'returned_for_revision' && <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">This request was returned. Revise the requested values before resubmitting if changes are required.</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {actions.includes('revise') && editable && <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => beginRevision(request)}><Pencil className="mr-1.5 h-4 w-4" />Revise</Button>}
                    {actions.includes('submit') && <Button size="sm" disabled={busyId === id} onClick={() => void act(request, 'submit')}><Send className="mr-1.5 h-4 w-4" />Submit</Button>}
                    {actions.includes('resubmit') && <Button size="sm" disabled={busyId === id} onClick={() => void act(request, 'resubmit')}><RotateCcw className="mr-1.5 h-4 w-4" />Resubmit</Button>}
                    {actions.includes('withdraw') && <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => void act(request, 'withdraw')}><Undo2 className="mr-1.5 h-4 w-4" />Withdraw</Button>}
                    {actions.includes('cancel') && <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => void act(request, 'cancel')}>Cancel</Button>}
                  </div>
                </div>
                {activity.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-primary">Approval activity</summary><div className="mt-3 max-w-2xl"><ApprovalTimeline activities={activity} /></div></details>}
              </article>;
            })}
          </section>
        )}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Revise request</DialogTitle><DialogDescription>Update the returned request. Saving keeps it in returned status so you can review the revision before resubmitting.</DialogDescription></DialogHeader>
          {editing && <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label htmlFor="revision-title">Title</Label><Input id="revision-title" value={editing.title} onChange={event => setEditing(current => current ? { ...current, title: event.target.value } : current)} /></div>
            <div className="space-y-1.5"><Label htmlFor="revision-reason">Reason</Label><Textarea id="revision-reason" className="min-h-20" value={editing.reason} onChange={event => setEditing(current => current ? { ...current, reason: event.target.value } : current)} /></div>
            <div className="space-y-1.5"><Label htmlFor="revision-values">Requested values</Label><Textarea id="revision-values" className="min-h-56 font-mono text-xs" value={valuesText} onChange={event => setValuesText(event.target.value)} /><p className="text-xs text-muted-foreground">Keep the field names shown here; update only the values that need correction.</p></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editing || busyId === editing.id || editing.title.trim().length < 3 || editing.reason.trim().length < 3} onClick={() => void saveRevision()}>{busyId === editing?.id ? 'Saving…' : 'Save revision'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-3 bg-card px-4 py-4"><FileClock className="h-4 w-4 text-primary" /><div><p className="text-xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>;
}
