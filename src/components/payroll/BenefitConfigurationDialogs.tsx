"use client";

import * as React from 'react';
import { CheckCircleIcon, MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Row = Record<string, unknown>;
type PlanRules = {
  employmentTypes: string[];
  departmentIds: string[];
  locations: string[];
  statuses: string[];
  minimumServiceMonths: number;
  approvalRequired: boolean;
};

const defaultRules: PlanRules = {
  employmentTypes: [], departmentIds: [], locations: [], statuses: ['active', 'probation'], minimumServiceMonths: 0, approvalRequired: true,
};

function rulesFrom(value: unknown): PlanRules {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultRules;
  const rules = value as Record<string, unknown>;
  return {
    employmentTypes: Array.isArray(rules.employmentTypes) ? rules.employmentTypes.map(String) : [],
    departmentIds: Array.isArray(rules.departmentIds) ? rules.departmentIds.map(String) : [],
    locations: Array.isArray(rules.locations) ? rules.locations.map(String) : [],
    statuses: Array.isArray(rules.statuses) ? rules.statuses.map(String) : ['active', 'probation'],
    minimumServiceMonths: Number(rules.minimumServiceMonths || 0),
    approvalRequired: rules.approvalRequired !== false,
  };
}

function planForm(plan: Row | null) {
  return {
    id: plan?.id ? String(plan.id) : undefined,
    name: String(plan?.name || ''),
    type: String(plan?.type || 'health_insurance'),
    providerCode: String(plan?.provider_code || plan?.provider || ''),
    description: String(plan?.description || ''),
    employeeCost: String(plan?.employee_cost || ''),
    employerCost: String(plan?.employer_cost || ''),
    effectiveFrom: String(plan?.effective_from || '').slice(0, 10),
    effectiveTo: String(plan?.effective_to || '').slice(0, 10),
    isActive: plan?.is_active !== false,
    rules: rulesFrom(plan?.eligibility_rules),
  };
}

function employeeMatches(employee: Row, rules: PlanRules) {
  const months = employee.hire_date ? Math.max(0, (Date.now() - new Date(String(employee.hire_date)).getTime()) / 2_629_800_000) : 999;
  return (!rules.employmentTypes.length || rules.employmentTypes.includes(String(employee.employment_type || 'full_time')))
    && (!rules.departmentIds.length || rules.departmentIds.includes(String(employee.department_id || '')))
    && (!rules.locations.length || rules.locations.includes(String(employee.location || '')))
    && (!rules.statuses.length || rules.statuses.includes(String(employee.status || 'active')))
    && months >= rules.minimumServiceMonths;
}

function ToggleList({ values, selected, onChange }: { values: Array<{ value: string; label: string }>; selected: string[]; onChange: (next: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{values.map(option => { const active = selected.includes(option.value); return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(active ? selected.filter(value => value !== option.value) : [...selected, option.value])} className={cn('rounded-md border px-3 py-2 text-xs font-medium transition-colors', active ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'border-border bg-background text-muted-foreground hover:bg-muted')}>{option.label}</button>; })}</div>;
}

export function BenefitPlanEditor({ open, plan, employees, busy, onOpenChange, onSave }: { open: boolean; plan: Row | null; employees: Row[]; busy: string; onOpenChange: (open: boolean) => void; onSave: (body: Row, key: string) => Promise<unknown> }) {
  const [form, setForm] = React.useState(() => planForm(plan));
  React.useEffect(() => { if (open) setForm(planForm(plan)); }, [open, plan]);
  const departments = React.useMemo(() => Array.from(new Map(employees.filter(employee => employee.department_id).map(employee => [String(employee.department_id), String(employee.department_name || employee.department_id)])).entries()).map(([value, label]) => ({ value, label })), [employees]);
  const locations = React.useMemo(() => Array.from(new Set(employees.map(employee => String(employee.location || '')).filter(Boolean))).map(value => ({ value, label: value })), [employees]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave({
      action: form.id ? 'update_plan' : 'create_plan', id: form.id, name: form.name, type: form.type,
      providerCode: form.providerCode || undefined, description: form.description || undefined,
      employeeCost: Number(form.employeeCost || 0), employerCost: Number(form.employerCost || 0),
      effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || undefined, isActive: form.isActive,
      eligibilityRules: form.rules, reason: form.id ? 'Benefit plan configuration updated' : 'Benefit plan configured',
    }, form.id ? `plan-${form.id}` : 'plan-create');
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{form.id ? 'Edit benefit plan' : 'Add benefit plan'}</DialogTitle><DialogDescription>Configure coverage, contributions, eligibility, effective dates, and approval behavior in one place.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-6 py-2">
    <section><h3 className="text-sm font-semibold">Plan details</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Plan name<Input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))}/></label><label className="grid gap-2 text-sm font-medium">Plan type<select className="h-11 rounded-md border border-input bg-background px-3" value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))}><option value="health_insurance">Health insurance</option><option value="dental">Dental</option><option value="life_insurance">Life insurance</option><option value="wellness">Wellness</option><option value="vision">Vision</option><option value="accident">Accident</option></select></label><label className="grid gap-2 text-sm font-medium">Provider<Input value={form.providerCode} onChange={event => setForm(current => ({ ...current, providerCode: event.target.value }))} placeholder="Provider name or code"/></label><label className="grid gap-2 text-sm font-medium sm:col-span-2">Coverage description<textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows={3} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Describe coverage, exclusions, and policy limits"/></label></div></section>
    <section className="border-t border-border pt-5"><h3 className="text-sm font-semibold">Cost and effective dates</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="grid gap-2 text-sm font-medium">Employee / month<Input type="number" min="0" step="0.01" value={form.employeeCost} onChange={event => setForm(current => ({ ...current, employeeCost: event.target.value }))}/></label><label className="grid gap-2 text-sm font-medium">Employer / month<Input type="number" min="0" step="0.01" value={form.employerCost} onChange={event => setForm(current => ({ ...current, employerCost: event.target.value }))}/></label><label className="grid gap-2 text-sm font-medium">Effective from<Input required type="date" value={form.effectiveFrom} onChange={event => setForm(current => ({ ...current, effectiveFrom: event.target.value }))}/></label><label className="grid gap-2 text-sm font-medium">Effective to<Input type="date" value={form.effectiveTo} onChange={event => setForm(current => ({ ...current, effectiveTo: event.target.value }))}/></label></div></section>
    <section className="border-t border-border pt-5"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold">Eligibility conditions</h3><p className="mt-1 text-xs text-muted-foreground">Leave a condition empty to include everyone in that category.</p></div><label className="inline-flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={form.isActive} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))}/>Plan active</label></div><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><p className="mb-2 text-xs font-semibold">Employment type</p><ToggleList values={[{value:'full_time',label:'Full time'},{value:'part_time',label:'Part time'},{value:'contractor',label:'Contractor'},{value:'intern',label:'Intern'}]} selected={form.rules.employmentTypes} onChange={employmentTypes => setForm(current => ({ ...current, rules: { ...current.rules, employmentTypes } }))}/></div><div><p className="mb-2 text-xs font-semibold">Employee status</p><ToggleList values={[{value:'active',label:'Active'},{value:'probation',label:'Probation'},{value:'onboarding',label:'Onboarding'},{value:'notice',label:'Notice period'}]} selected={form.rules.statuses} onChange={statuses => setForm(current => ({ ...current, rules: { ...current.rules, statuses } }))}/></div><div><p className="mb-2 text-xs font-semibold">Department</p><ToggleList values={departments} selected={form.rules.departmentIds} onChange={departmentIds => setForm(current => ({ ...current, rules: { ...current.rules, departmentIds } }))}/></div><div><p className="mb-2 text-xs font-semibold">Location</p><ToggleList values={locations} selected={form.rules.locations} onChange={nextLocations => setForm(current => ({ ...current, rules: { ...current.rules, locations: nextLocations } }))}/></div><label className="grid gap-2 text-sm font-medium">Minimum service (months)<Input type="number" min="0" value={form.rules.minimumServiceMonths} onChange={event => setForm(current => ({ ...current, rules: { ...current.rules, minimumServiceMonths: Number(event.target.value || 0) } }))}/></label><label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"><input type="checkbox" checked={form.rules.approvalRequired} onChange={event => setForm(current => ({ ...current, rules: { ...current.rules, approvalRequired: event.target.checked } }))}/><span><strong className="block">Require HR approval</strong><span className="text-xs text-muted-foreground">New enrollments enter the approval queue before payroll deductions begin.</span></span></label></div></section>
    <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={Boolean(busy)}>{busy.startsWith('plan-') ? 'Saving…' : 'Save plan'}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}

export function BenefitEnrollmentDialog({ open, defaultPlanId, plans, employees, busy, onOpenChange, onEnroll }: { open: boolean; defaultPlanId: string; plans: Row[]; employees: Row[]; busy: string; onOpenChange: (open: boolean) => void; onEnroll: (body: Row, key: string) => Promise<unknown> }) {
  const [mode, setMode] = React.useState<'rules' | 'manual'>('rules');
  const [planId, setPlanId] = React.useState(defaultPlanId);
  const [effectiveFrom, setEffectiveFrom] = React.useState('2026-09-01');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [query, setQuery] = React.useState('');
  const plan = React.useMemo(() => plans.find(item => String(item.id) === planId) || null, [planId, plans]);
  const rules = React.useMemo(() => rulesFrom(plan?.eligibility_rules), [plan]);
  const matched = React.useMemo(() => employees.filter(employee => employeeMatches(employee, rules)), [employees, rules]);
  const visible = React.useMemo(() => (mode === 'rules' ? matched : employees).filter(employee => `${employee.name || ''} ${employee.employee_number || ''} ${employee.job_title || ''}`.toLowerCase().includes(query.toLowerCase())), [employees, matched, mode, query]);

  React.useEffect(() => { if (open) { setPlanId(defaultPlanId || String(plans.find(item => item.is_active)?.id || '')); setSelectedIds([]); setQuery(''); } }, [defaultPlanId, open, plans]);
  React.useEffect(() => { if (mode === 'rules') setSelectedIds(matched.map(employee => String(employee.id))); }, [matched, mode]);

  const toggle = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onEnroll({ action: 'enroll', benefitPlanId: planId, employeeIds: selectedIds, effectiveFrom, enrollmentMode: mode, reason: mode === 'rules' ? 'Eligible employee population enrolled from plan conditions' : 'Employees manually selected for benefit enrollment' }, 'enroll-create');
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-4xl"><DialogHeader><DialogTitle>Enroll employees</DialogTitle><DialogDescription>Apply the plan’s eligibility conditions or manually choose the employees to enroll.</DialogDescription></DialogHeader><form onSubmit={submit} className="flex min-h-0 flex-col gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Benefit plan<select required className="h-11 rounded-md border border-input bg-background px-3" value={planId} onChange={event => setPlanId(event.target.value)}><option value="">Select plan</option>{plans.filter(item => item.is_active).map(item => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Coverage starts<Input required type="date" value={effectiveFrom} onChange={event => setEffectiveFrom(event.target.value)}/></label></div><div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1"><button type="button" onClick={() => setMode('rules')} className={cn('rounded px-3 py-2 text-sm font-semibold', mode === 'rules' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>Use eligibility conditions</button><button type="button" onClick={() => { setMode('manual'); setSelectedIds([]); }} className={cn('rounded px-3 py-2 text-sm font-semibold', mode === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>Select manually</button></div>{mode === 'rules' && <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"><p className="font-semibold">Current plan conditions</p><p className="mt-1">{rules.employmentTypes.length ? rules.employmentTypes.join(', ') : 'All employment types'} · {rules.statuses.length ? rules.statuses.join(', ') : 'All statuses'} · Minimum {rules.minimumServiceMonths} months service</p></div>}<div className="flex items-center justify-between gap-3"><label className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search employees" className="pl-9"/></label><div className="inline-flex items-center gap-2 text-xs font-semibold"><UsersIcon className="h-4 w-4"/>{selectedIds.length} selected</div></div><div className="min-h-0 max-h-[330px] overflow-y-auto rounded-md border border-border"><div className="sticky top-0 flex items-center justify-between border-b border-border bg-muted px-4 py-2 text-xs"><span>{mode === 'rules' ? `${matched.length} employees match the conditions` : `${employees.length} employees available`}</span><button type="button" className="font-semibold text-primary" onClick={() => setSelectedIds(visible.map(employee => String(employee.id)))}>Select visible</button></div><div className="divide-y divide-border">{visible.map(employee => { const id=String(employee.id); const selected=selectedIds.includes(id); return <label key={id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/60"><input type="checkbox" checked={selected} onChange={() => toggle(id)}/><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{String(employee.name || 'E').split(/\s+/).map(part=>part[0]).join('').slice(0,2)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{String(employee.name || 'Employee')}</strong><span className="text-xs text-muted-foreground">{String(employee.employee_number || '')} · {String(employee.job_title || employee.employment_type || 'Employee')}</span></span>{selected && <CheckCircleIcon className="h-5 w-5 text-emerald-500"/>}</label>; })}</div></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={Boolean(busy) || !planId || !effectiveFrom || !selectedIds.length}>{busy === 'enroll-create' ? 'Creating enrollments…' : `Enroll ${selectedIds.length} employee${selectedIds.length === 1 ? '' : 's'}`}</Button></DialogFooter></form></DialogContent></Dialog>;
}
