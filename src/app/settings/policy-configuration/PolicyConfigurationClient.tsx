"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { PolicyAreaDefinition, PolicyFieldDefinition } from './policy-configuration-model';

type PolicyValue = string | number | boolean;

export function PolicyConfigurationClient({ area }: { area: PolicyAreaDefinition }) {
  const [values, setValues] = useState<Record<string, PolicyValue>>(area.defaults);
  const [savedValues, setSavedValues] = useState<Record<string, PolicyValue>>(area.defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(savedValues), [savedValues, values]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/settings/system-settings?keys=${encodeURIComponent(area.settingKey)}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load configuration.');
        const payload = await response.json() as Record<string, unknown>;
        const raw = payload[area.settingKey];
        const persisted = typeof raw === 'string' ? JSON.parse(raw) as Record<string, PolicyValue> : {};
        return { ...area.defaults, ...persisted };
      })
      .then(nextValues => {
        if (cancelled) return;
        setValues(nextValues);
        setSavedValues(nextValues);
      })
      .catch(error => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Unable to load configuration.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [area]);

  const update = (key: string, value: PolicyValue) => {
    setValues(current => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: area.settingKey, value: JSON.stringify(values) }]),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || 'Unable to save configuration.');
      }
      setSavedValues(values);
      toast.success(`${area.title} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="grid min-h-[420px] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  }

  return (
    <main className="min-h-full bg-[#f5f7fa] px-4 py-5 text-slate-950 dark:bg-[#0b1118] dark:text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-[1080px]">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-[-0.02em]">{area.title}</h1>
                {!dirty && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-zinc-400">{area.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={saving || !dirty} onClick={() => setValues(savedValues)}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Discard
            </Button>
            <Button type="button" size="sm" disabled={saving || !dirty} onClick={() => void save()}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Save changes
            </Button>
          </div>
        </header>

        <div className="mt-5 space-y-5">
          {area.sections.map(section => (
            <section key={section.title} className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-5">
                <h2 className="text-sm font-semibold">{section.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{section.description}</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {section.fields.map(field => (
                  <PolicyFieldRow key={field.key} field={field} value={values[field.key]} onChange={value => update(field.key, value)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function PolicyFieldRow({ field, value, onChange }: { field: PolicyFieldDefinition; value: PolicyValue | undefined; onChange: (value: PolicyValue) => void }) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] md:items-center">
      <div className="min-w-0">
        <label htmlFor={`policy-${field.key}`} className="text-sm font-medium text-slate-800 dark:text-zinc-200">{field.label}</label>
        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-zinc-400">{field.description}</p>
      </div>
      <PolicyControl field={field} value={value} onChange={onChange} />
    </div>
  );
}

function PolicyControl({ field, value, onChange }: { field: PolicyFieldDefinition; value: PolicyValue | undefined; onChange: (value: PolicyValue) => void }) {
  const id = `policy-${field.key}`;
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">{value ? 'Enabled' : 'Disabled'}</span>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <select id={id} value={String(value ?? '')} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return <Textarea id={id} value={String(value ?? '')} onChange={event => onChange(event.target.value)} />;
  }

  return (
    <Input
      id={id}
      type={field.type === 'number' ? 'number' : 'text'}
      min={field.min}
      max={field.max}
      value={String(value ?? '')}
      onChange={event => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
      className={cn(field.type === 'number' && 'tabular-nums')}
    />
  );
}
