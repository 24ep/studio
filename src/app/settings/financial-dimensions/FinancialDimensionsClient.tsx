'use client';

import * as React from 'react';
import { Building2, CircleDollarSign, FolderKanban, Loader2, Pencil, Plus, RefreshCw, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { SortableNativeHeader, type SortDirection, sortRowsByColumn, type SortValueResolverMap } from '@/components/ui/sortable-table';

type Resource = 'cost-centers' | 'projects';
type Company = { id: string; name: string; isActive?: boolean };
type MasterRecord = {
  id: string;
  companyId: string | null;
  companyName?: string | null;
  code: string;
  name: string;
  description?: string | null;
  ownerEmployeeId?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  costCenterId?: string | null;
  costCenterName?: string | null;
  status?: 'draft' | 'active' | 'on_hold' | 'closed' | 'archived';
  isActive?: boolean;
  billable?: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  version: number;
};

type FormState = {
  companyId: string;
  code: string;
  name: string;
  description: string;
  relatedId: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
  billable: boolean;
  reason: string;
};

const today = new Date().toISOString().slice(0, 10);
const emptyForm: FormState = { companyId: '', code: '', name: '', description: '', relatedId: '', effectiveFrom: today, effectiveTo: '', status: 'active', billable: false, reason: '' };

export function FinancialDimensionsClient({ canEdit, initialResource = 'cost-centers' }: { canEdit: boolean; initialResource?: Resource }) {
  const [resource, setResource] = React.useState<Resource>(initialResource);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [companyId, setCompanyId] = React.useState('');
  const [records, setRecords] = React.useState<MasterRecord[]>([]);
  const [costCenters, setCostCenters] = React.useState<MasterRecord[]>([]);
  const [selected, setSelected] = React.useState<MasterRecord | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const codeInputRef = React.useRef<HTMLInputElement>(null);

  const loadCompanies = React.useCallback(async () => {
    const response = await fetch('/api/settings/company-references', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json() as unknown;
    if (Array.isArray(payload)) setCompanies(payload.filter((item): item is Company => Boolean(item && typeof item === 'object' && 'id' in item && 'name' in item)));
  }, []);

  const loadRecords = React.useCallback(async () => {
    setLoading(true);
    setError('');
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    try {
      const [recordResponse, costCenterResponse] = await Promise.all([
        fetch(`/api/hr/master-data/${resource}${query}`, { cache: 'no-store' }),
        fetch(`/api/hr/master-data/cost-centers${query}`, { cache: 'no-store' }),
      ]);
      const recordBody = await recordResponse.json();
      const costCenterBody = resource === 'cost-centers' ? recordBody : await costCenterResponse.json();
      if (!recordResponse.ok) throw new Error(recordBody?.error?.message || 'Unable to load financial dimensions.');
      setRecords(Array.isArray(recordBody.data) ? recordBody.data : []);
      setCostCenters(Array.isArray(costCenterBody.data) ? costCenterBody.data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load financial dimensions.');
    } finally {
      setLoading(false);
    }
  }, [companyId, resource]);

  React.useEffect(() => { void loadCompanies(); }, [loadCompanies]);
  React.useEffect(() => { void loadRecords(); }, [loadRecords]);
  React.useEffect(() => { resetForm(); }, [resource, companyId]);

  function resetForm() {
    setSelected(null);
    setForm({ ...emptyForm, companyId });
  }

  function startCreate() {
    resetForm();
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      codeInputRef.current?.focus({ preventScroll: true });
    });
  }

  function startEdit(record: MasterRecord) {
    setSelected(record);
    setForm({
      companyId: record.companyId || '',
      code: record.code,
      name: record.name,
      description: record.description || '',
      relatedId: resource === 'projects' ? record.costCenterId || '' : record.parentId || '',
      effectiveFrom: record.effectiveFrom?.slice(0, 10) || today,
      effectiveTo: record.effectiveTo?.slice(0, 10) || '',
      status: resource === 'projects' ? record.status || 'active' : record.isActive === false ? 'inactive' : 'active',
      billable: Boolean(record.billable),
      reason: '',
    });
  }

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return toast.error('Code and name are required.');
    if (selected && form.reason.trim().length < 2) return toast.error('Add a reason for this change.');
    setSaving(true);
    try {
      const payload = {
        companyId: form.companyId || null,
        code: form.code,
        name: form.name,
        description: form.description || null,
        ownerEmployeeId: null,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        ...(resource === 'projects'
          ? { costCenterId: form.relatedId || null, status: form.status, billable: form.billable }
          : { parentId: form.relatedId || null, isActive: form.status === 'active' }),
        ...(selected ? { expectedVersion: selected.version, reason: form.reason } : {}),
      };
      const response = await fetch(`/api/hr/master-data/${resource}${selected ? `?id=${selected.id}` : ''}`, {
        method: selected ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to save the record.');
      toast.success(selected ? 'Changes saved' : `${resource === 'projects' ? 'Project' : 'Cost center'} created`);
      startCreate();
      await loadRecords();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to save the record.');
    } finally {
      setSaving(false);
    }
  }

  const visibleRecords = records.filter(record => `${record.code} ${record.name} ${record.companyName || ''}`.toLowerCase().includes(search.toLowerCase()));
  const activeCount = records.filter(record => resource === 'projects' ? record.status === 'active' : record.isActive !== false).length;

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">HR setup · Financial dimensions</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Cost centers and projects</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Use one governed code across timesheets, attendance, expenses, payroll, reporting, and integrations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadRecords()} disabled={loading}><RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Refresh</Button>
            {canEdit && <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />New {resource === 'projects' ? 'project' : 'cost center'}</Button>}
          </div>
        </header>

        <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          <Summary icon={resource === 'projects' ? FolderKanban : CircleDollarSign} label="Records" value={records.length} helper={resource === 'projects' ? 'Project codes' : 'Cost center codes'} />
          <Summary icon={Building2} label="Active" value={activeCount} helper="Available to operational workflows" />
          <Summary icon={CircleDollarSign} label="Governance" value={records.length - activeCount} helper="Inactive, closed, or archived" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border bg-background">
            <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Financial dimension type">
                <Tab active={resource === 'cost-centers'} onClick={() => setResource('cost-centers')}>Cost centers</Tab>
                <Tab active={resource === 'projects'} onClick={() => setResource('projects')}>Projects</Tab>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative"><span className="sr-only">Search records</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search code or name" className="min-h-11 pl-9 sm:w-64" /></label>
                <select aria-label="Filter by company" value={companyId} onChange={event => setCompanyId(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All permitted companies</option>
                  {companies.filter(company => company.isActive !== false).map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </div>
            </div>
            {loading ? <State><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading master data…</State>
              : error ? <State tone="error"><p className="font-medium">Unable to load records</p><p className="mt-1 text-xs">{error}</p><Button variant="outline" className="mt-4 min-h-11" onClick={() => void loadRecords()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></State>
              : visibleRecords.length === 0 ? <State><p className="font-medium">No matching records</p><p className="mt-1 text-xs">Create the first governed code or change the filters.</p></State>
              : <DimensionRecords records={visibleRecords} resource={resource} canEdit={canEdit} onSelect={startEdit} />}
          </section>

          <form ref={formRef} onSubmit={save} className="h-fit scroll-mt-6 rounded-xl border bg-background p-5 xl:sticky xl:top-6">
            <div className="border-b pb-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{selected ? 'Edit governed record' : 'Create governed record'}</p><h2 className="mt-1 text-lg font-semibold">{selected ? selected.name : resource === 'projects' ? 'New project' : 'New cost center'}</h2></div>
            <fieldset disabled={!canEdit || saving} className="mt-5 grid gap-4">
              <Field label="Company" htmlFor="dimension-company"><select id="dimension-company" value={form.companyId} onChange={event => update('companyId', event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Shared / no company</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
              <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]"><Field label="Code" htmlFor="dimension-code"><Input ref={codeInputRef} id="dimension-code" className="min-h-11" value={form.code} onChange={event => update('code', event.target.value.toUpperCase())} maxLength={40} required /></Field><Field label="Name" htmlFor="dimension-name"><Input id="dimension-name" className="min-h-11" value={form.name} onChange={event => update('name', event.target.value)} required /></Field></div>
              <Field label="Description" htmlFor="dimension-description"><Textarea id="dimension-description" value={form.description} onChange={event => update('description', event.target.value)} rows={3} /></Field>
              <Field label={resource === 'projects' ? 'Cost center' : 'Parent cost center'} htmlFor="dimension-related"><select id="dimension-related" value={form.relatedId} onChange={event => update('relatedId', event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">None</option>{costCenters.filter(item => item.id !== selected?.id).map(item => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></Field>
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Effective from" htmlFor="dimension-from"><Input id="dimension-from" className="min-h-11" type="date" value={form.effectiveFrom} onChange={event => update('effectiveFrom', event.target.value)} required /></Field><Field label="Effective to" htmlFor="dimension-to"><Input id="dimension-to" className="min-h-11" type="date" value={form.effectiveTo} onChange={event => update('effectiveTo', event.target.value)} min={form.effectiveFrom} /></Field></div>
              <Field label="Status" htmlFor="dimension-status"><select id="dimension-status" value={form.status} onChange={event => update('status', event.target.value)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{(resource === 'projects' ? ['draft', 'active', 'on_hold', 'closed', 'archived'] : ['active', 'inactive']).map(value => <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>)}</select></Field>
              {resource === 'projects' && <label className="flex min-h-11 items-center gap-3 rounded-md border px-3"><input type="checkbox" checked={form.billable} onChange={event => update('billable', event.target.checked)} /><span><span className="block text-sm font-medium">Billable project</span><span className="block text-xs text-muted-foreground">Allow client-billable time and expense coding.</span></span></label>}
              {selected && <Field label="Reason for change" htmlFor="dimension-reason"><Textarea id="dimension-reason" value={form.reason} onChange={event => update('reason', event.target.value)} rows={2} required placeholder="Explain why this governed record is changing" /></Field>}
            </fieldset>
            <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={startCreate}>Clear</Button><Button type="submit" disabled={!canEdit || saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{selected ? 'Save changes' : 'Create record'}</Button></div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Summary({ icon: Icon, label, value, helper }: { icon: React.ElementType; label: string; value: number; helper: string }) { return <div className="flex items-center gap-3 bg-background px-5 py-4"><Icon className="h-5 w-5 text-primary" /><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{value} <span className="text-xs font-normal text-muted-foreground">{helper}</span></p></div></div>; }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn('min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{children}</button>; }
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div><Label htmlFor={htmlFor}>{label}</Label><div className="mt-1.5">{children}</div></div>; }
function State({ children, tone }: { children: React.ReactNode; tone?: 'error' }) { return <div className={cn('p-10 text-center text-sm text-muted-foreground', tone === 'error' && 'text-destructive')}>{children}</div>; }
function Status({ value }: { value: string }) { const active = value === 'active'; return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize', active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : value === 'draft' || value === 'on_hold' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground')}>{value.replace(/_/g, ' ')}</span>; }

function DimensionRecords({ records, resource, canEdit, onSelect }: { records: MasterRecord[]; resource: Resource; canEdit: boolean; onSelect: (record: MasterRecord) => void }) {
  const relation = (record: MasterRecord) => resource === 'projects' ? record.costCenterName || '—' : record.parentName || '—';
  const status = (record: MasterRecord) => resource === 'projects' ? record.status || 'active' : record.isActive === false ? 'inactive' : 'active';
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const sortValueResolvers: SortValueResolverMap<MasterRecord> = {
    codeName: (record) => `${record.code} ${record.name}`.trim(),
    company: (record) => record.companyName || 'Shared',
    relation: (record) => relation(record),
    status: (record) => status(record),
  };
  const sortedRecords = sortRowsByColumn(records, sortColumn, sortDirection, sortValueResolvers);
  const handleSort = (column: string | null, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  return (
    <>
      <div className="divide-y md:hidden">
        {records.map(record => (
          <article key={record.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold">{record.code}</p><p className="break-words text-sm text-muted-foreground">{record.name}</p></div>
              <Status value={status(record)} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Company</dt><dd className="mt-1 break-words">{record.companyName || 'Shared'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{resource === 'projects' ? 'Cost center' : 'Parent'}</dt><dd className="mt-1 break-words">{relation(record)}</dd></div>
            </dl>
            <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => onSelect(record)}><Pencil className="mr-2 h-4 w-4" />{canEdit ? 'Edit record' : 'View record'}</Button>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <SortableNativeHeader
                column="codeName"
                label="Code and name"
                className="px-4 py-3"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableNativeHeader
                column="company"
                label="Company"
                className="px-4 py-3"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableNativeHeader
                column="relation"
                label={resource === 'projects' ? 'Cost center' : 'Parent'}
                className="px-4 py-3"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableNativeHeader
                column="status"
                label="Status"
                className="px-4 py-3"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedRecords.map(record => (
              <tr key={record.id} className="hover:bg-muted/25">
                <td className="px-4 py-3"><p className="font-semibold">{record.code}</p><p className="max-w-72 break-words text-muted-foreground">{record.name}</p></td>
                <td className="px-4 py-3">{record.companyName || 'Shared'}</td><td className="px-4 py-3">{relation(record)}</td><td className="px-4 py-3"><Status value={status(record)} /></td>
                <td className="px-4 py-2 text-right"><Button type="button" variant="ghost" className="min-h-11" onClick={() => onSelect(record)}><Pencil className="mr-2 h-4 w-4" />{canEdit ? 'Edit' : 'View'}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
