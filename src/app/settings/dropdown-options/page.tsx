'use client';

import { useEffect, useState } from 'react';
import { CloudDownload, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { DropdownOptionGroup } from '@/lib/dropdown-option-catalog';
import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';

export default function DropdownOptionsPage() {
  const [groups, setGroups] = useState<DropdownOptionGroup[]>([]);
  const [busy, setBusy] = useState<'load' | 'save' | 'appkit' | null>('load');

  const load = async () => {
    setBusy('load');
    try {
      const response = await fetch('/api/settings/dropdown-options', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load dropdown options.');
      setGroups(await response.json());
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load options.'); }
    finally { setBusy(null); }
  };
  useEffect(() => { void load(); }, []);

  const importAppKit = async () => {
    setBusy('appkit');
    try {
      const response = await fetch('/api/settings/dropdown-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ environment: 'production', force: true }) });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(getJsonErrorMessage(payload, 'Unable to load AppKit dropdown options.'));
      await load();
      toast.success('Dropdown options loaded from AppKit.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to import options.'); setBusy(null); }
  };

  const save = async () => {
    setBusy('save');
    try {
      const response = await fetch('/api/settings/dropdown-options', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groups) });
      const payload = await readJsonObject(response);
      if (!response.ok) throw new Error(getJsonErrorMessage(payload, 'Unable to save dropdown options.'));
      setGroups(payload as unknown as DropdownOptionGroup[]);
      toast.success('Dropdown options saved.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save options.'); }
    finally { setBusy(null); }
  };

  const update = (groupIndex: number, optionIndex: number, patch: { label?: string; isActive?: boolean }) => setGroups(current => current.map((group, index) => index !== groupIndex ? group : ({ ...group, options: group.options.map((option, itemIndex) => itemIndex === optionIndex ? { ...option, ...patch } : option) })));

  return <main className="mx-auto max-w-6xl space-y-6 p-6 lg:p-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">HR Setup</p><h1 className="text-2xl font-bold">Dropdown options</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage business vocabulary shown across HR forms. Workflow states and record lookups are protected by their API contracts.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void importAppKit()} disabled={busy !== null}>{busy === 'appkit' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudDownload className="mr-2 h-4 w-4" />}Load from AppKit</Button><Button onClick={() => void save()} disabled={busy !== null}>{busy === 'save' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div></header>
    {busy === 'load' ? <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : <div className="grid gap-5 lg:grid-cols-2">{groups.map((group, groupIndex) => <section key={group.key} className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{group.label}</h2><p className="mb-4 mt-1 text-xs text-muted-foreground">{group.description}</p><div className="space-y-2">{group.options.sort((a, b) => a.sortOrder - b.sortOrder).map((option, optionIndex) => <div key={option.value} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div><Input aria-label={`${group.label}: ${option.value}`} value={option.label} onChange={event => update(groupIndex, optionIndex, { label: event.target.value })} /><p className="mt-1 font-mono text-[10px] text-muted-foreground">{option.value}</p></div><Switch aria-label={`Enable ${option.label}`} checked={option.isActive} onCheckedChange={isActive => update(groupIndex, optionIndex, { isActive })} /></div>)}</div></section>)}</div>}
  </main>;
}
