"use client";

import * as React from 'react';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ResourceRecord = Record<string, unknown> & { id: string };

export function HrResourceSearchSelect({ id, value, onValueChange, apiPath, labelKeys, placeholder, disabled }: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  apiPath: string;
  labelKeys: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [records, setRecords] = React.useState<ResourceRecord[]>([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetch(apiPath, { credentials: 'include', signal: controller.signal })
      .then(async (response): Promise<unknown> => response.ok ? response.json() : {})
      .then(payload => {
        if (Array.isArray(payload)) return setRecords(payload as ResourceRecord[]);
        const object = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
        const resource = object.resource && typeof object.resource === 'object' ? object.resource as Record<string, unknown> : {};
        const candidates = [resource.records, object.data, object.records];
        setRecords((candidates.find(Array.isArray) || []) as ResourceRecord[]);
      })
      .catch(error => { if (!(error instanceof DOMException && error.name === 'AbortError')) setRecords([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiPath]);
  const label = React.useCallback((record: ResourceRecord) => labelKeys.map(key => record[key]).filter(Boolean).map(String).join(' · ') || record.id, [labelKeys]);
  const selected = records.find(record => record.id === value);
  const filtered = records.filter(record => label(record).toLowerCase().includes(query.toLowerCase())).slice(0, 30);
  if (value && (selected || !open)) return <div className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2"><span className="truncate text-sm font-medium">{selected ? label(selected) : value}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={disabled} onClick={() => { onValueChange(''); setOpen(true); }} aria-label="Clear selection"><X className="h-4 w-4" /></Button></div>;
  return <div className="relative"><Input id={id} value={query} disabled={disabled} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} placeholder={placeholder} autoComplete="off" />{loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}{open && !loading && <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">{filtered.length ? filtered.map(record => <button key={record.id} type="button" className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none" onClick={() => { onValueChange(record.id); setQuery(''); setOpen(false); }}>{label(record)}</button>) : <p className="px-3 py-2 text-sm text-muted-foreground">No matching records.</p>}</div>}</div>;
}
