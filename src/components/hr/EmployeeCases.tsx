"use client";

import * as React from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface EmployeeCasesProps {
  employeeId: string;
  employeeName: string;
}

interface CaseRecord {
  id: string;
  caseNumber?: string | null;
  caseType?: string | null;
  confidentiality?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  ownerUserId?: string | null;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface CaseOwner {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface CasesResponse {
  data?: CaseRecord[];
  error?: { message?: string };
}

interface OwnersResponse {
  owners?: CaseOwner[];
  currentUserId?: string;
}

const emptyForm = {
  title: 'Written Warning',
  caseType: 'disciplinary',
  confidentiality: 'restricted',
  priority: 'normal',
  description: '',
  ownerUserId: '',
  dueAt: '',
};

type CaseForm = typeof emptyForm;

function displayOwner(owner: CaseOwner | undefined) {
  if (!owner) return 'Unassigned';
  return owner.name?.trim() || owner.email || 'Unnamed HR user';
}

function formatCaseValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.replace(/_/g, ' ') : '—';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function caseNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CASE-${stamp}-${suffix}`;
}

export function EmployeeCases({ employeeId, employeeName }: EmployeeCasesProps) {
  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [owners, setOwners] = React.useState<CaseOwner[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState<CaseForm>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);

  const loadCases = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [casesResponse, ownersResponse] = await Promise.all([
        fetch(`/api/hr/v1/cases?employeeId=${encodeURIComponent(employeeId)}&pageSize=100`, { credentials: 'include' }),
        fetch('/api/hr/case-owners', { credentials: 'include' }),
      ]);
      const casesPayload = await casesResponse.json().catch(() => ({})) as CasesResponse;
      const ownersPayload = await ownersResponse.json().catch(() => ({})) as OwnersResponse;
      if (!casesResponse.ok) throw new Error(casesPayload.error?.message || 'Unable to load HR cases.');
      if (!ownersResponse.ok) throw new Error('Unable to load HR case owners.');
      setCases(casesPayload.data || []);
      setOwners(ownersPayload.owners || []);
      setCurrentUserId(ownersPayload.currentUserId || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load HR cases.');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const updateForm = (field: keyof CaseForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const openDialog = () => {
    setForm({
      ...emptyForm,
      ownerUserId: owners.some(owner => owner.id === currentUserId) ? currentUserId : '',
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const createCase = async () => {
    if (form.description.trim().length < 2) {
      setFormError('Add a short description before creating the case.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const response = await fetch('/api/hr/v1/cases', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          caseNumber: caseNumber(),
          caseType: form.caseType,
          confidentiality: form.confidentiality,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          ownerUserId: form.ownerUserId || null,
          dueAt: form.dueAt ? new Date(`${form.dueAt}T23:59:59`).toISOString() : null,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to create the HR case.');
      setIsDialogOpen(false);
      await loadCases();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Unable to create the HR case.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">People · Sensitive records</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">HR Cases</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Document disciplinary, investigation, and corrective-action work for {employeeName} with a clear owner and audit trail.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadCases()} disabled={isLoading}>
            <ArrowPathIcon className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={openDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New case
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Open cases" value={cases.filter(item => item.status !== 'closed').length} detail="Needs follow-up" />
        <Summary label="Disciplinary" value={cases.filter(item => item.caseType === 'disciplinary').length} detail="Formal warnings and actions" />
        <Summary label="Assigned" value={cases.filter(item => item.ownerUserId).length} detail="Has an owner" />
      </div>

      {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Case register</h3>
          <p className="mt-1 text-xs text-muted-foreground">Restricted to HR People Managers.</p>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-lg bg-muted" /><div className="h-16 animate-pulse rounded-lg bg-muted" /></div>
        ) : cases.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <ShieldCheckIcon className="mx-auto h-10 w-10 text-primary/70" />
            <h3 className="mt-4 text-sm font-semibold text-foreground">No HR cases yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Create a disciplinary case to record a Written Warning or another formal employee action.</p>
            <Button type="button" className="mt-5" onClick={openDialog}><PlusIcon className="mr-2 h-4 w-4" />Create first case</Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map(item => {
              const owner = owners.find(candidate => candidate.id === item.ownerUserId);
              return (
                <article key={item.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(180px,1.3fr)_150px_140px_minmax(160px,1fr)] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{item.title || 'Untitled case'}</p>
                      <Badge variant="outline" className="capitalize">{formatCaseValue(item.caseType)}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.caseNumber || item.id}</p>
                    {item.description ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p> : null}
                  </div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p><Badge className="mt-1 capitalize" variant={item.status === 'closed' ? 'secondary' : 'default'}>{formatCaseValue(item.status)}</Badge></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</p><p className="mt-1 text-sm font-medium capitalize text-foreground">{formatCaseValue(item.priority)}</p><p className="mt-1 text-xs text-muted-foreground">Created {formatDate(item.createdAt)}</p></div>
                  <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Owner</p><p className="mt-1 truncate text-sm font-medium text-foreground">{displayOwner(owner)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDaysIcon className="h-3.5 w-3.5" />Due {formatDate(item.dueAt)}</p></div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create HR case</DialogTitle>
            <DialogDescription>Record a sensitive employee matter and assign an accountable HR owner.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {formError ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{formError}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Case title"><Input value={form.title} onChange={event => updateForm('title', event.target.value)} placeholder="Written Warning" /></Field>
              <Field label="Case type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize" value={form.caseType} onChange={event => updateForm('caseType', event.target.value)}><option value="disciplinary">Disciplinary</option><option value="corrective_action">Corrective action</option><option value="investigation">Investigation</option><option value="grievance">Grievance</option><option value="complaint">Complaint</option><option value="other">Other</option></select></Field>
              <Field label="Assign owner"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.ownerUserId} onChange={event => updateForm('ownerUserId', event.target.value)}><option value="">Unassigned</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{displayOwner(owner)}</option>)}</select></Field>
              <Field label="Priority"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize" value={form.priority} onChange={event => updateForm('priority', event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
              <Field label="Confidentiality"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.confidentiality} onChange={event => updateForm('confidentiality', event.target.value)}><option value="restricted">Restricted</option><option value="strictly_confidential">Strictly confidential</option></select></Field>
              <Field label="Due date"><Input type="date" value={form.dueAt} onChange={event => updateForm('dueAt', event.target.value)} /></Field>
            </div>
            <Field label="Description"><Textarea rows={5} value={form.description} onChange={event => updateForm('description', event.target.value)} placeholder="Record the facts, policy reference, employee response, and next steps." /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="button" onClick={() => void createCase()} disabled={isSaving}>{isSaving ? 'Creating…' : 'Create case'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Summary({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-xl border border-border bg-background px-4 py-4"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
