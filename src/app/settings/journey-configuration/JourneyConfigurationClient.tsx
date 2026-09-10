"use client";

import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  CopyPlus,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  EMPLOYEE_JOURNEY_CONFIGURATION_KEY,
  defaultEmployeeJourneyConfiguration,
  getJourneyConfigurationGaps,
  parseEmployeeJourneyConfiguration,
  type EmployeeJourneyConfiguration,
  type EmployeeJourneyStage,
  type EmployeeJourneyTemplate,
} from '@/lib/employee-journey-configuration';

type AdminRecord = Record<string, unknown> & { id: string };
type HrPayload = { resource?: { records?: AdminRecord[] }; records?: AdminRecord[] };

const ownerRoles = ['People Operations', 'Line manager', 'Employee', 'IT Operations', 'IT Security', 'Payroll', 'Finance'];

export function JourneyConfigurationClient() {
  const [configuration, setConfiguration] = React.useState<EmployeeJourneyConfiguration>(defaultEmployeeJourneyConfiguration);
  const [savedConfiguration, setSavedConfiguration] = React.useState<EmployeeJourneyConfiguration>(defaultEmployeeJourneyConfiguration);
  const [selectedId, setSelectedId] = React.useState(defaultEmployeeJourneyConfiguration.templates[0].id);
  const [onboardingCounts, setOnboardingCounts] = React.useState({ templates: 0, tasks: 0 });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(configuration) !== JSON.stringify(savedConfiguration);
  const gaps = React.useMemo(() => getJourneyConfigurationGaps(configuration), [configuration]);
  const selected = configuration.templates.find(template => template.id === selectedId) ?? configuration.templates[0];

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResponse, templatesResponse, tasksResponse] = await Promise.all([
        fetch(`/api/settings/system-settings?keys=${EMPLOYEE_JOURNEY_CONFIGURATION_KEY}`, { cache: 'no-store' }),
        fetch('/api/hr/onboarding?view=templates', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/hr/onboarding?view=tasks', { cache: 'no-store', credentials: 'include' }),
      ]);
      if (!settingsResponse.ok) throw new Error('Unable to load journey configuration.');
      const payload = await settingsResponse.json() as Record<string, unknown>;
      const next = parseEmployeeJourneyConfiguration(payload[EMPLOYEE_JOURNEY_CONFIGURATION_KEY]);
      setConfiguration(next);
      setSavedConfiguration(next);
      setSelectedId(current => next.templates.some(template => template.id === current) ? current : next.templates[0]?.id ?? '');
      const [templatesPayload, tasksPayload] = await Promise.all([
        templatesResponse.ok ? templatesResponse.json() as Promise<HrPayload> : Promise.resolve({} as HrPayload),
        tasksResponse.ok ? tasksResponse.json() as Promise<HrPayload> : Promise.resolve({} as HrPayload),
      ]);
      setOnboardingCounts({ templates: records(templatesPayload).length, tasks: records(tasksPayload).length });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load journey configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const updateTemplate = (changes: Partial<EmployeeJourneyTemplate>) => {
    setConfiguration(current => ({
      ...current,
      templates: current.templates.map(template => template.id === selectedId ? { ...template, ...changes } : template),
    }));
  };

  const updateStage = (stageId: string, changes: Partial<EmployeeJourneyStage>) => {
    if (!selected) return;
    updateTemplate({ stages: selected.stages.map(stage => stage.id === stageId ? { ...stage, ...changes } : stage) });
  };

  const addStage = () => {
    if (!selected) return;
    const id = `stage-${Date.now()}`;
    updateTemplate({
      stages: [...selected.stages, {
        id,
        title: 'New journey stage',
        description: '',
        ownerRole: 'People Operations',
        dueOffsetDays: 0,
        required: true,
        employeeVisible: true,
      }],
    });
  };

  const removeStage = (stageId: string) => {
    if (!selected) return;
    updateTemplate({ stages: selected.stages.filter(stage => stage.id !== stageId) });
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: EMPLOYEE_JOURNEY_CONFIGURATION_KEY, value: JSON.stringify(configuration) }]),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save journey configuration.');
      setSavedConfiguration(configuration);
      toast.success('Journey configuration saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save journey configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="grid min-h-[520px] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return (
    <main className="min-h-full bg-[#f5f7fa] text-slate-950 dark:bg-[#0b1118] dark:text-zinc-100">
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-[1260px] flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-[-0.02em]">Employee journey configuration</h1>
              <span className={cn('text-xs font-semibold', gaps.length ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                {gaps.length ? `${gaps.length} configuration gap${gaps.length === 1 ? '' : 's'}` : 'Coverage complete'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Define the stages, owners, timing, visibility, and completion rules used by employee lifecycle journeys.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={() => setConfiguration(savedConfiguration)}><RotateCcw className="mr-1.5 h-4 w-4" />Discard</Button>
            <Button size="sm" disabled={!dirty || saving || gaps.some(gap => gap.severity === 'critical')} onClick={() => void save()}>{saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Save changes</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1260px] gap-4 p-4 lg:grid-cols-[270px_minmax(0,1fr)] lg:p-5">
        <aside className="self-start overflow-hidden rounded-md border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-zinc-800"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Journey templates</p></div>
          <div className="p-2">
            <Link href="/settings/onboarding" className="group mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><ClipboardCheck className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">Onboarding</strong><span className="block truncate text-[11px] text-slate-500">{onboardingCounts.templates} templates · {onboardingCounts.tasks} tasks</span></span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {configuration.templates.map(template => {
              const templateGaps = gaps.filter(gap => gap.templateId === template.id);
              return <button key={template.id} type="button" onClick={() => setSelectedId(template.id)} className={cn('mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors', selectedId === template.id ? 'bg-blue-50 text-blue-950 dark:bg-blue-950/60 dark:text-blue-100' : 'hover:bg-slate-50 dark:hover:bg-zinc-800')}>
                <span className={cn('grid h-8 w-8 place-items-center rounded-full', templateGaps.length ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300')}>{templateGaps.length ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{template.name}</strong><span className="block text-[11px] capitalize text-slate-500">{template.journeyType} · {template.stages.length} stages</span></span>
              </button>;
            })}
          </div>
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-zinc-800">
            <p className="font-medium text-slate-700 dark:text-zinc-200">Coverage check</p>
            <p className="mt-1 leading-5">Gaps are calculated from live templates and block activation only when critical.</p>
          </div>
        </aside>

        {selected && <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-4 border-b border-slate-200 px-5 py-5 dark:border-zinc-800 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
              <FieldLabel label="Template name" hint="Shown to HR administrators." />
              <Input value={selected.name} onChange={event => updateTemplate({ name: event.target.value })} />
              <FieldLabel label="Description" hint="Explain when this journey applies." />
              <Textarea rows={2} value={selected.description} onChange={event => updateTemplate({ description: event.target.value })} />
            </div>
            <div className="flex items-center justify-between border-y border-slate-200 py-3 md:block md:border-y-0 md:border-l md:py-0 md:pl-5 dark:border-zinc-800">
              <div><p className="text-sm font-medium">Active template</p><p className="mt-1 text-xs leading-5 text-slate-500">Applied to new {selected.journeyType} journeys.</p></div>
              <Switch className="md:mt-4" checked={selected.isActive} onCheckedChange={isActive => updateTemplate({ isActive })} />
            </div>
          </div>

          {gaps.some(gap => gap.templateId === selected.id) && <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide">Configuration gaps</p>
            <ul className="mt-2 space-y-1 text-sm">{gaps.filter(gap => gap.templateId === selected.id).map(gap => <li key={gap.id} className="flex items-start gap-2"><CircleDot className="mt-0.5 h-4 w-4 shrink-0" />{gap.message}</li>)}</ul>
          </div>}

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-zinc-800">
            <div><h2 className="text-sm font-semibold">Journey stages</h2><p className="mt-0.5 text-xs text-slate-500">Timing is relative to the journey anchor date. Negative values occur before it.</p></div>
            <Button size="sm" variant="outline" onClick={addStage}><Plus className="mr-1.5 h-4 w-4" />Add stage</Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {selected.stages.map((stage, index) => <div key={stage.id} className="grid gap-x-6 gap-y-4 px-5 py-5 xl:grid-cols-[38px_minmax(0,1fr)_minmax(270px,0.72fr)]">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-xs font-semibold text-slate-500 dark:border-zinc-700">{index + 1}</span>
              <div className="space-y-3">
                <Input aria-label={`Stage ${index + 1} title`} value={stage.title} onChange={event => updateStage(stage.id, { title: event.target.value })} />
                <Textarea aria-label={`Stage ${index + 1} description`} rows={2} value={stage.description} onChange={event => updateStage(stage.id, { description: event.target.value })} placeholder="What must be completed at this stage?" />
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3"><span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Owner</span><select value={stage.ownerRole} onChange={event => updateStage(stage.id, { ownerRole: event.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">{ownerRoles.map(role => <option key={role}>{role}</option>)}</select></div>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3"><span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Due offset</span><Input type="number" value={stage.dueOffsetDays} onChange={event => updateStage(stage.id, { dueOffsetDays: Number(event.target.value) })} /></div>
                <ToggleRow label="Required" checked={stage.required} onCheckedChange={required => updateStage(stage.id, { required })} />
                <ToggleRow label="Employee visible" checked={stage.employeeVisible} onCheckedChange={employeeVisible => updateStage(stage.id, { employeeVisible })} />
                <div className="flex justify-end"><Button size="sm" variant="ghost" className="text-rose-600" onClick={() => removeStage(stage.id)}><Trash2 className="mr-1.5 h-4 w-4" />Remove</Button></div>
              </div>
            </div>)}
            {!selected.stages.length && <div className="px-6 py-16 text-center"><CopyPlus className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-3 text-sm font-semibold">No journey stages</h3><p className="mt-1 text-xs text-slate-500">Add the first stage to make this template usable.</p><Button className="mt-4" size="sm" onClick={addStage}><Plus className="mr-1.5 h-4 w-4" />Add first stage</Button></div>}
          </div>
        </section>}
      </div>
    </main>
  );
}

function records(payload: HrPayload) { return payload.resource?.records ?? payload.records ?? []; }

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return <div><p className="text-sm font-medium">{label}</p><p className="mt-0.5 text-xs text-slate-500">{hint}</p></div>;
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800"><span className="text-xs font-medium text-slate-600 dark:text-zinc-300">{label}</span><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
