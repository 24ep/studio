"use client";

import * as React from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PlusIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HrisEmptyState } from '@/components/hris/HrisWorkspacePrimitives';
import { cn } from '@/lib/utils';

type ResourceKey =
  | 'assignments'
  | 'employment-events'
  | 'compensation-reviews'
  | 'succession-plans'
  | 'talent-reviews'
  | 'internal-opportunities'
  | 'workforce-plans'
  | 'retention-policies'
  | 'privacy-requests'
  | 'integration-mappings'
  | 'feature-flags';

export interface HrisOperationAccess {
  key: ResourceKey;
  canManage: boolean;
}

type Row = Record<string, unknown> & { id: string; version?: number | string };
type FormState = Record<string, string | boolean>;

const RESOURCE_DEFINITIONS: Record<ResourceKey, { label: string; description: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; statuses: string[] }> = {
  assignments: { label: 'Assignments', description: 'Effective-dated roles, managers, departments, and work arrangements.', icon: UserGroupIcon, statuses: ['active', 'inactive', 'ended', 'corrected'] },
  'employment-events': { label: 'Employment events', description: 'Record transfers, promotions, manager changes, and contract changes.', icon: CalendarDaysIcon, statuses: ['draft', 'pending', 'approved', 'applied', 'rejected', 'cancelled'] },
  'compensation-reviews': { label: 'Compensation reviews', description: 'Plan review cycles, budgets, dates, and decision guidelines.', icon: ChartBarIcon, statuses: ['draft', 'open', 'under_review', 'approved', 'completed', 'cancelled'] },
  'succession-plans': { label: 'Succession', description: 'Track critical roles, incumbents, successor readiness, and risk.', icon: UserGroupIcon, statuses: ['draft', 'active', 'archived'] },
  'talent-reviews': { label: 'Talent reviews', description: 'Schedule structured talent review sessions and assessment configuration.', icon: CheckCircleIcon, statuses: ['draft', 'scheduled', 'in_progress', 'completed', 'archived'] },
  'internal-opportunities': { label: 'Internal mobility', description: 'Publish internal opportunities with eligibility rules and windows.', icon: DocumentTextIcon, statuses: ['draft', 'published', 'closed', 'archived'] },
  'workforce-plans': { label: 'Workforce plans', description: 'Model planning periods, scenarios, demand, supply, and cost forecasts.', icon: ChartBarIcon, statuses: ['draft', 'active', 'approved', 'archived'] },
  'retention-policies': { label: 'Retention policies', description: 'Define legal basis, retention periods, and record actions.', icon: DocumentTextIcon, statuses: [] },
  'privacy-requests': { label: 'Privacy requests', description: 'Manage access, correction, export, restriction, and deletion requests.', icon: DocumentTextIcon, statuses: ['received', 'in_progress', 'completed', 'closed', 'withdrawn', 'rejected'] },
  'integration-mappings': { label: 'Integration mappings', description: 'Connect external provider keys to internal HRIS resources.', icon: Cog6ToothIcon, statuses: ['active', 'inactive'] },
  'feature-flags': { label: 'Feature flags', description: 'Enable company-scoped HR features with configuration payloads.', icon: WrenchScrewdriverIcon, statuses: [] },
};

const RESOURCE_ORDER = Object.keys(RESOURCE_DEFINITIONS) as ResourceKey[];
function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialForm(key: ResourceKey): FormState {
  switch (key) {
    case 'assignments': return { employeeId: '', clientId: '', assignmentType: 'primary', employmentType: 'full_time', jobTitle: '', location: '', positionId: '', departmentId: '', managerId: '', gradeId: '', workScheduleId: '', contractNumber: '', effectiveFrom: today(), effectiveTo: '', reason: '' };
    case 'employment-events': return { employeeId: '', eventType: 'transfer', effectiveDate: today(), proposedValues: '{}', reason: '', requestId: '', idempotencyKey: `employment-event-${Date.now()}` };
    case 'compensation-reviews': return { name: '', effectiveDate: today(), budgetAmount: '0', currency: 'THB', guidelines: '{}' };
    case 'succession-plans': return { positionId: '', incumbentEmployeeId: '', criticality: 'normal', riskLevel: 'medium', notes: '' };
    case 'talent-reviews': return { name: '', reviewDate: today(), configuration: '{}' };
    case 'internal-opportunities': return { positionId: '', title: '', description: '', eligibilityRules: '{}', opensAt: '', closesAt: '' };
    case 'workforce-plans': return { name: '', planningPeriodStart: today(), planningPeriodEnd: '', scenario: 'baseline', assumptions: '{}', demand: '[]', supply: '[]', costForecast: '{}' };
    case 'retention-policies': return { recordType: '', retentionDays: '365', legalBasis: '', action: 'review', isActive: true };
    case 'privacy-requests': return { employeeId: '', requestType: 'access', dueAt: '', scope: '{}' };
    case 'integration-mappings': return { integrationType: 'identity', provider: '', externalKey: '', internalResource: '', internalId: '', configuration: '{}' };
    case 'feature-flags': return { featureKey: '', enabled: false, configuration: '{}' };
  }
}

function formFromRow(key: ResourceKey, row: Row): FormState {
  const form = initialForm(key);
  Object.keys(form).forEach(field => {
    const value = row[field];
    if (value === undefined || value === null) return;
    if (typeof form[field] === 'boolean') {
      form[field] = Boolean(value);
      return;
    }
    if (typeof value === 'object') {
      form[field] = JSON.stringify(value, null, 2);
      return;
    }
    const stringValue = String(value);
    if (field.endsWith('At')) {
      const date = new Date(stringValue);
      form[field] = Number.isNaN(date.getTime()) ? stringValue : date.toISOString().slice(0, 16);
    } else if (/^(effective|review|planningPeriod|dueAt)/i.test(field) && stringValue.length > 10) {
      form[field] = stringValue.slice(0, 10);
    } else {
      form[field] = stringValue;
    }
  });
  return form;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).replace(/_/g, ' ');
}

function dateValue(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function parseJson(value: string, label: string, array = false) {
  try {
    const parsed = JSON.parse(value || (array ? '[]' : '{}')) as unknown;
    if (array && !Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
    if (!array && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) throw new Error(`${label} must be a JSON object.`);
    return parsed;
  } catch (error) {
    throw new Error(error instanceof Error && error.message.startsWith(label) ? error.message : `${label} must contain valid JSON.`);
  }
}

function payloadFor(key: ResourceKey, form: FormState) {
  const value = (name: string) => String(form[name] ?? '').trim();
  switch (key) {
    case 'assignments': return {
      employeeId: value('employeeId'), assignmentType: value('assignmentType'), employmentType: value('employmentType'),
      jobTitle: value('jobTitle') || null, location: value('location') || null, clientId: value('clientId') || null, positionId: value('positionId') || null,
      departmentId: value('departmentId') || null, managerId: value('managerId') || null, gradeId: value('gradeId') || null,
      workScheduleId: value('workScheduleId') || null, contractNumber: value('contractNumber') || null,
      effectiveFrom: value('effectiveFrom'), effectiveTo: value('effectiveTo') || null, reason: value('reason'),
    };
    case 'employment-events': return {
      employeeId: value('employeeId'), eventType: value('eventType'), effectiveDate: value('effectiveDate'),
      proposedValues: parseJson(value('proposedValues'), 'Proposed values'), reason: value('reason'),
      requestId: value('requestId') || null, idempotencyKey: value('idempotencyKey'),
    };
    case 'compensation-reviews': return { name: value('name'), effectiveDate: value('effectiveDate'), budgetAmount: Number(value('budgetAmount')), currency: value('currency'), guidelines: parseJson(value('guidelines'), 'Guidelines') };
    case 'succession-plans': return { positionId: value('positionId') || null, incumbentEmployeeId: value('incumbentEmployeeId') || null, criticality: value('criticality'), riskLevel: value('riskLevel') || null, notes: value('notes') || null };
    case 'talent-reviews': return { name: value('name'), reviewDate: value('reviewDate'), configuration: parseJson(value('configuration'), 'Configuration') };
    case 'internal-opportunities': return { positionId: value('positionId') || null, title: value('title'), description: value('description') || null, eligibilityRules: parseJson(value('eligibilityRules'), 'Eligibility rules'), opensAt: toIso(value('opensAt')), closesAt: toIso(value('closesAt')) };
    case 'workforce-plans': return { name: value('name'), planningPeriodStart: value('planningPeriodStart'), planningPeriodEnd: value('planningPeriodEnd'), scenario: value('scenario'), assumptions: parseJson(value('assumptions'), 'Assumptions'), demand: parseJson(value('demand'), 'Demand', true), supply: parseJson(value('supply'), 'Supply', true), costForecast: parseJson(value('costForecast'), 'Cost forecast') };
    case 'retention-policies': return { recordType: value('recordType'), retentionDays: Number(value('retentionDays')), legalBasis: value('legalBasis'), action: value('action'), isActive: Boolean(form.isActive) };
    case 'privacy-requests': return { employeeId: value('employeeId') || null, requestType: value('requestType'), dueAt: toIso(value('dueAt')), scope: parseJson(value('scope'), 'Scope') };
    case 'integration-mappings': return { integrationType: value('integrationType'), provider: value('provider'), externalKey: value('externalKey'), internalResource: value('internalResource'), internalId: value('internalId') || null, configuration: parseJson(value('configuration'), 'Configuration') };
    case 'feature-flags': return { featureKey: value('featureKey'), enabled: Boolean(form.enabled), configuration: parseJson(value('configuration'), 'Configuration') };
  }
}

function updatePayloadFor(key: ResourceKey, form: FormState) {
  const payload = payloadFor(key, form) as Record<string, unknown>;
  if (key === 'assignments' || key === 'employment-events') delete payload.employeeId;
  if (key === 'employment-events') delete payload.idempotencyKey;
  if (key === 'feature-flags') delete payload.featureKey;
  return payload;
}

function primaryLabel(key: ResourceKey, row: Row) {
  switch (key) {
    case 'assignments': return `${formatValue(row.jobTitle)} · ${formatValue(row.assignmentType)}`;
    case 'employment-events': return formatValue(row.eventType);
    case 'compensation-reviews': return formatValue(row.name);
    case 'succession-plans': return `Position ${formatValue(row.positionId)}`;
    case 'talent-reviews': return formatValue(row.name);
    case 'internal-opportunities': return formatValue(row.title);
    case 'workforce-plans': return formatValue(row.name);
    case 'retention-policies': return formatValue(row.recordType);
    case 'privacy-requests': return `${formatValue(row.requestType)} request`;
    case 'integration-mappings': return `${formatValue(row.provider)} · ${formatValue(row.integrationType)}`;
    case 'feature-flags': return formatValue(row.featureKey);
  }
}

function secondaryLabel(key: ResourceKey, row: Row) {
  switch (key) {
    case 'assignments': return `${formatValue(row.employeeId)} · ${dateValue(row.effectiveFrom)}`;
    case 'employment-events': return `${formatValue(row.employeeId)} · ${dateValue(row.effectiveDate)}`;
    case 'compensation-reviews': return `${formatValue(row.currency)} ${formatValue(row.budgetAmount)} · ${dateValue(row.effectiveDate)}`;
    case 'succession-plans': return `${formatValue(row.criticality)} criticality · ${formatValue(row.riskLevel)} risk`;
    case 'talent-reviews': return dateValue(row.reviewDate);
    case 'internal-opportunities': return `${dateValue(row.opensAt)} → ${dateValue(row.closesAt)}`;
    case 'workforce-plans': return `${dateValue(row.planningPeriodStart)} → ${dateValue(row.planningPeriodEnd)} · ${formatValue(row.scenario)}`;
    case 'retention-policies': return `${formatValue(row.retentionDays)} days · ${formatValue(row.action)}`;
    case 'privacy-requests': return `${formatValue(row.employeeId)} · due ${dateValue(row.dueAt)}`;
    case 'integration-mappings': return `${formatValue(row.externalKey)} → ${formatValue(row.internalResource)}`;
    case 'feature-flags': return formatValue(row.enabled);
  }
}

export function HrisOperationsWorkspace({ resources, employeeId, employeeName, embedded = false }: { resources: HrisOperationAccess[]; employeeId?: string; employeeName?: string; embedded?: boolean }) {
  const availableResources = RESOURCE_ORDER.filter(key => resources.some(item => item.key === key));
  const [activeKey, setActiveKey] = React.useState<ResourceKey>(availableResources[0] || 'assignments');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const initialFormFor = React.useCallback((key: ResourceKey): FormState => ({
    ...initialForm(key),
    ...(employeeId ? { employeeId, __lockedEmployeeName: employeeName || 'Current employee' } : {}),
  }), [employeeId, employeeName]);
  const [form, setForm] = React.useState<FormState>(() => ({ ...initialForm(availableResources[0] || 'assignments'), ...(employeeId ? { employeeId, __lockedEmployeeName: employeeName || 'Current employee' } : {}) }));
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [statusEdit, setStatusEdit] = React.useState<{ id: string; version: number; status: string } | null>(null);
  const [editingRow, setEditingRow] = React.useState<Row | null>(null);

  const activeAccess = resources.find(item => item.key === activeKey);
  const definition = RESOURCE_DEFINITIONS[activeKey];

  const load = React.useCallback(async () => {
    setLoading(true); setError(null); setStatusEdit(null);
    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (employeeId) params.set('employeeId', employeeId);
      const response = await fetch(`/api/hr/v1/${activeKey}?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { data?: Row[]; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to load HRIS records.');
      setRows(payload.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load HRIS records.');
      setRows([]);
    } finally { setLoading(false); }
  }, [activeKey, employeeId]);

  React.useEffect(() => { void load(); }, [load]);

  const selectResource = (key: ResourceKey) => {
    setActiveKey(key); setForm(initialFormFor(key)); setFormError(null); setFormOpen(false); setEditingRow(null);
  };

  const updateForm = (field: string, value: string | boolean) => setForm(current => ({ ...current, [field]: value }));

  const saveRecord = async () => {
    if (!activeAccess?.canManage) return;
    setSaving(true); setFormError(null);
    try {
      const response = editingRow
        ? await fetch(`/api/hr/v1/${activeKey}?id=${encodeURIComponent(editingRow.id)}`, {
          method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedVersion: Number(editingRow.version || 1), reason: 'Updated from HRIS Operations', changes: updatePayloadFor(activeKey, form) }),
        })
        : await fetch(`/api/hr/v1/${activeKey}`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadFor(activeKey, form)),
        });
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || `Unable to ${editingRow ? 'update' : 'create'} the HRIS record.`);
      setFormOpen(false); setForm(initialFormFor(activeKey)); setEditingRow(null); await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : `Unable to ${editingRow ? 'update' : 'create'} the HRIS record.`);
    } finally { setSaving(false); }
  };

  const saveStatus = async () => {
    if (!statusEdit) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/hr/v1/${activeKey}?id=${encodeURIComponent(statusEdit.id)}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: statusEdit.version, status: statusEdit.status, reason: `Status changed to ${statusEdit.status}`, changes: {} }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to update the HRIS record.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update the HRIS record.');
    } finally { setSaving(false); }
  };

  return (
    <main className={cn('min-h-full text-foreground', embedded ? 'bg-background' : 'bg-muted/10 p-4 sm:p-6')}>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{embedded ? 'Employee operations' : 'People · HRIS operations'}</p>
            <h1 className={cn('mt-2 font-bold tracking-tight', embedded ? 'text-xl' : 'text-3xl')}>{embedded ? `${employeeName || 'Employee'} records` : 'Operations workbench'}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{embedded ? 'Manage assignments, employment changes, and privacy requests for this employee.' : 'Manage the structured HRIS records behind employee movement, talent decisions, planning, privacy, and integrations.'}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}><ArrowPathIcon className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Refresh</Button>
        </header>

        <nav className="overflow-x-auto border-b border-border bg-background" aria-label="HRIS operations sections">
          <div className="flex min-w-max gap-1 p-2">
            {availableResources.map(key => {
              const Icon = RESOURCE_DEFINITIONS[key].icon;
              return <button key={key} type="button" onClick={() => selectResource(key)} className={cn('inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors', activeKey === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} aria-current={activeKey === key ? 'page' : undefined}><Icon className="h-4 w-4" />{RESOURCE_DEFINITIONS[key].label}</button>;
            })}
          </div>
        </nav>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{definition.label}</p><h2 className="mt-2 text-xl font-bold">{definition.label} register</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{definition.description}</p></div>
          {activeAccess?.canManage ? <Button type="button" onClick={() => { setEditingRow(null); setForm(initialFormFor(activeKey)); setFormError(null); setFormOpen(open => !open); }}><PlusIcon className="mr-2 h-4 w-4" />{formOpen ? 'Close form' : `New ${definition.label.toLowerCase().replace(/s$/, '')}`}</Button> : <Badge variant="outline">View only</Badge>}
        </section>

        {formOpen && activeAccess?.canManage ? <section className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5"><div className="mb-4"><h3 className="font-semibold">{editingRow ? `Edit ${definition.label.toLowerCase().replace(/s$/, '')}` : `Create ${definition.label.toLowerCase().replace(/s$/, '')}`}</h3><p className="mt-1 text-sm text-muted-foreground">Required values are validated by the HRIS API before saving.</p></div>{formError ? <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{formError}</p> : null}<ResourceForm resource={activeKey} form={form} onChange={updateForm} /><div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditingRow(null); }} disabled={saving}>Cancel</Button><Button type="button" onClick={() => void saveRecord()} disabled={saving}>{saving ? 'Saving…' : editingRow ? 'Save changes' : 'Create record'}</Button></div></section> : null}

        {error ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
        <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{definition.label} records</h3><p className="mt-1 text-sm text-muted-foreground">{loading ? 'Loading…' : `${rows.length} visible record${rows.length === 1 ? '' : 's'}`}</p></div><Badge variant="outline">Versioned and audited</Badge></div>
          {loading ? <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-lg bg-muted" /><div className="h-16 animate-pulse rounded-lg bg-muted" /></div> : rows.length === 0 ? <div className="p-10"><HrisEmptyState icon={definition.icon} title={`No ${definition.label.toLowerCase()} yet`} description={activeAccess?.canManage ? `Create the first ${definition.label.toLowerCase().replace(/s$/, '')} record to start this workflow.` : 'Records will appear here when they are created by an authorized HR operator.'} /></div> : <div className="divide-y divide-border">{rows.map(row => <RecordRow key={row.id} resource={activeKey} row={row} statusEdit={statusEdit} onEditStatus={setStatusEdit} onEdit={() => { setEditingRow(row); setForm({ ...formFromRow(activeKey, row), ...(employeeId ? { employeeId, __lockedEmployeeName: employeeName || 'Current employee' } : {}) }); setFormError(null); setFormOpen(true); }} onSaveStatus={() => void saveStatus()} saving={saving} canManage={Boolean(activeAccess?.canManage)} />)}</div>}
        </section>
      </div>
    </main>
  );
}

function ResourceForm({ resource, form, onChange }: { resource: ResourceKey; form: FormState; onChange: (field: string, value: string | boolean) => void }) {
  const input = (field: string, label: string, type = 'text', placeholder?: string) => <Field key={field} label={label}><Input type={type} value={String(form[field] ?? '')} placeholder={placeholder} onChange={event => onChange(field, event.target.value)} /></Field>;
  const select = (field: string, label: string, options: string[]) => <Field key={field} label={label}><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize" value={String(form[field] ?? '')} onChange={event => onChange(field, event.target.value)}>{options.map(option => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}</select></Field>;
  const json = (field: string, label: string, rows = 4, placeholder = '{}') => <div key={field} className="sm:col-span-2"><Field label={label}><Textarea rows={rows} value={String(form[field] ?? '')} placeholder={placeholder} onChange={event => onChange(field, event.target.value)} /><p className="mt-1 text-xs text-muted-foreground">Enter valid JSON.</p></Field></div>;
  const employee = (field: string, label: string) => <Field key={field} label={label}>{form.__lockedEmployeeName ? <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium">{String(form.__lockedEmployeeName)}</div> : <HrEmployeeSearchSelect value={String(form[field] ?? '')} onValueChange={value => onChange(field, value)} />}</Field>;

  switch (resource) {
    case 'assignments': return <div className="grid gap-4 sm:grid-cols-2">{employee('employeeId', 'Employee')}{select('assignmentType', 'Assignment type', ['primary', 'secondary', 'temporary', 'secondment'])}{select('employmentType', 'Employment type', ['full_time', 'part_time', 'contractor', 'subcontract', 'intern'])}{input('jobTitle', 'Job title')}{input('location', 'Location')}{input('clientId', 'Client ID', 'text', 'Optional UUID')}{input('positionId', 'Position ID', 'text', 'Optional UUID')}{input('departmentId', 'Department ID', 'text', 'Optional UUID')}{input('managerId', 'Manager ID', 'text', 'Optional UUID')}{input('gradeId', 'Grade ID', 'text', 'Optional UUID')}{input('workScheduleId', 'Work schedule ID', 'text', 'Optional UUID')}{input('contractNumber', 'Contract number')}{input('effectiveFrom', 'Effective from', 'date')}{input('effectiveTo', 'Effective to', 'date')}{divField('reason', 'Reason', form, onChange, 4, 'Why is this assignment being created?')}</div>;
    case 'employment-events': return <div className="grid gap-4 sm:grid-cols-2">{employee('employeeId', 'Employee')}{select('eventType', 'Event type', ['hire', 'transfer', 'promotion', 'demotion', 'manager_change', 'location_change', 'contract_change', 'probation_decision', 'correction'])}{input('effectiveDate', 'Effective date', 'date')}{input('requestId', 'Request ID', 'text', 'Optional request reference')}{input('idempotencyKey', 'Idempotency key')}{divField('reason', 'Reason', form, onChange, 4, 'Explain the employment change.')}{json('proposedValues', 'Proposed values', 5)}</div>;
    case 'compensation-reviews': return <div className="grid gap-4 sm:grid-cols-2">{input('name', 'Review cycle name', 'text', '2027 Annual Compensation Review')}{input('effectiveDate', 'Effective date', 'date')}{input('budgetAmount', 'Budget amount', 'number', '0')}{input('currency', 'Currency', 'text', 'THB')}{json('guidelines', 'Guidelines', 5)}</div>;
    case 'succession-plans': return <div className="grid gap-4 sm:grid-cols-2">{input('positionId', 'Position ID', 'text', 'Optional UUID')}{employee('incumbentEmployeeId', 'Incumbent employee')}{select('criticality', 'Criticality', ['normal', 'important', 'critical'])}{select('riskLevel', 'Risk level', ['low', 'medium', 'high'])}{divField('notes', 'Notes', form, onChange, 4, 'Successor context, readiness notes, and risk rationale.')}</div>;
    case 'talent-reviews': return <div className="grid gap-4 sm:grid-cols-2">{input('name', 'Review name', 'text', 'Mid-year talent review')}{input('reviewDate', 'Review date', 'date')}{json('configuration', 'Configuration', 5)}</div>;
    case 'internal-opportunities': return <div className="grid gap-4 sm:grid-cols-2">{input('title', 'Opportunity title')}{input('positionId', 'Position ID', 'text', 'Optional UUID')}{input('opensAt', 'Opens at', 'datetime-local')}{input('closesAt', 'Closes at', 'datetime-local')}{divField('description', 'Description', form, onChange, 4, 'Describe the opportunity and expectations.')}{json('eligibilityRules', 'Eligibility rules', 5)}</div>;
    case 'workforce-plans': return <div className="grid gap-4 sm:grid-cols-2">{input('name', 'Plan name', 'text', 'FY2027 baseline plan')}{input('scenario', 'Scenario', 'text', 'baseline')}{input('planningPeriodStart', 'Planning period start', 'date')}{input('planningPeriodEnd', 'Planning period end', 'date')}{json('assumptions', 'Assumptions')}{json('demand', 'Demand', 5, '[]')}{json('supply', 'Supply', 5, '[]')}{json('costForecast', 'Cost forecast')}</div>;
    case 'retention-policies': return <div className="grid gap-4 sm:grid-cols-2">{input('recordType', 'Record type', 'text', 'employee_documents')}{input('retentionDays', 'Retention days', 'number', '365')}{select('action', 'Action', ['review', 'archive', 'anonymize', 'delete'])}<FieldCheckbox label="Policy active" checked={Boolean(form.isActive)} onChange={value => onChange('isActive', value)} />{divField('legalBasis', 'Legal basis', form, onChange, 4, 'Policy or legal justification for this retention period.')}</div>;
    case 'privacy-requests': return <div className="grid gap-4 sm:grid-cols-2">{employee('employeeId', 'Employee')}{select('requestType', 'Request type', ['access', 'correction', 'export', 'restriction', 'deletion'])}{input('dueAt', 'Due at', 'datetime-local')}{json('scope', 'Request scope', 5)}</div>;
    case 'integration-mappings': return <div className="grid gap-4 sm:grid-cols-2">{select('integrationType', 'Integration type', ['identity', 'banking', 'accounting', 'benefits', 'time', 'payroll'])}{input('provider', 'Provider', 'text', 'Workday, Azure AD, etc.')}{input('externalKey', 'External key')}{input('internalResource', 'Internal resource', 'text', 'employees')}{input('internalId', 'Internal ID', 'text', 'Optional UUID')}{json('configuration', 'Configuration', 5)}</div>;
    case 'feature-flags': return <div className="grid gap-4 sm:grid-cols-2">{input('featureKey', 'Feature key', 'text', 'effective_employment')}<FieldCheckbox label="Enabled" checked={Boolean(form.enabled)} onChange={value => onChange('enabled', value)} />{json('configuration', 'Configuration', 5)}</div>;
  }
}

function RecordRow({ resource, row, statusEdit, onEditStatus, onEdit, onSaveStatus, saving, canManage }: { resource: ResourceKey; row: Row; statusEdit: { id: string; version: number; status: string } | null; onEditStatus: (value: { id: string; version: number; status: string } | null) => void; onEdit: () => void; onSaveStatus: () => void; saving: boolean; canManage: boolean }) {
  const statusOptions = RESOURCE_DEFINITIONS[resource].statuses;
  const hasStatus = typeof row.status === 'string' && row.status.length > 0 && statusOptions.length > 0;
  const editing = statusEdit?.id === row.id;
  return <article className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(220px,1.35fr)_minmax(220px,1fr)_180px_auto] lg:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold capitalize text-foreground">{primaryLabel(resource, row)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{secondaryLabel(resource, row)}</p><p className="mt-2 truncate text-xs text-muted-foreground">ID: {row.id}</p></div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{detailLabel(resource, row)}</p></div><div>{hasStatus ? editing ? <div className="flex items-center gap-2"><select aria-label={`Status for ${primaryLabel(resource, row)}`} className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-xs capitalize" value={statusEdit.status} onChange={event => onEditStatus({ ...statusEdit, status: event.target.value })}>{statusOptions.map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</select><Button type="button" size="sm" onClick={onSaveStatus} disabled={saving}>Save</Button></div> : <Badge variant="outline" className="capitalize">{formatValue(row.status)}</Badge> : <span className="text-sm text-muted-foreground">No status workflow</span>}</div><div className="flex flex-wrap justify-start gap-2 lg:justify-end">{canManage && <Button type="button" size="sm" variant="outline" onClick={onEdit}>Edit</Button>}{canManage && hasStatus && !editing ? <Button type="button" size="sm" variant="ghost" onClick={() => onEditStatus({ id: row.id, version: Number(row.version || 1), status: String(row.status) })}>Status</Button> : null}</div></article>;
}

function detailLabel(key: ResourceKey, row: Row) {
  const fields: Record<ResourceKey, string[]> = {
    assignments: ['employmentType', 'jobTitle', 'location', 'reason'],
    'employment-events': ['proposedValues', 'reason'],
    'compensation-reviews': ['guidelines'],
    'succession-plans': ['notes'],
    'talent-reviews': ['configuration'],
    'internal-opportunities': ['description', 'eligibilityRules'],
    'workforce-plans': ['assumptions', 'costForecast'],
    'retention-policies': ['legalBasis'],
    'privacy-requests': ['scope'],
    'integration-mappings': ['configuration'],
    'feature-flags': ['configuration'],
  };
  const values = fields[key].map(field => row[field]).filter(value => value !== null && value !== undefined && value !== '');
  return values.length ? values.map(formatValue).join(' · ') : 'No additional details';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function divField(field: string, label: string, form: FormState, onChange: (field: string, value: string | boolean) => void, rows: number, placeholder: string) {
  return <div key={field} className="sm:col-span-2"><Field label={label}><Textarea rows={rows} value={String(form[field] ?? '')} placeholder={placeholder} onChange={event => onChange(field, event.target.value)} /></Field></div>;
}

function FieldCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-10 items-center gap-3 rounded-md border border-input bg-background px-3 text-sm"><input type="checkbox" className="h-4 w-4 rounded border-input" checked={checked} onChange={event => onChange(event.target.checked)} /><span>{label}</span></label>;
}
