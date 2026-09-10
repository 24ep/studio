"use client";

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { HrisEmptyState, HrisStatusBadge } from './HrisWorkspacePrimitives';

interface TimelineItem {
  id: string;
  module: string;
  title: string;
  status: string;
  occurredAt: string;
  details: Record<string, unknown>;
}

const moduleLinks: Record<string, string> = {
  Onboarding: '/learning/onboarding',
  Leave: '/workforce/leave',
  Attendance: '/workforce/attendance',
  Learning: '/learning',
  Performance: '/workforce/performance',
  Payroll: '/payroll',
  Lifecycle: '/people',
  Offboarding: '/people/offboarding',
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function EmployeeModuleTimeline({ employeeId, module }: { employeeId: string; module: string }) {
  const [items, setItems] = React.useState<TimelineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void fetch(`/api/hr/v1/employees/${employeeId}/timeline?module=${encodeURIComponent(module)}`, { cache: 'no-store' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load employee records.');
        if (active) setItems((body.data || []).filter((item: TimelineItem) => item.module === module));
      })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employeeId, module]);

  if (loading) return <div className="min-h-[300px] animate-pulse rounded-xl bg-muted/30" aria-label={`Loading ${module} records`} />;
  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{module}</h2>
          <p className="text-sm text-muted-foreground">Live records from the employee’s source module.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href={moduleLinks[module] || '/people'}>Open workspace</Link></Button>
      </div>
      {items.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border">
          <HrisEmptyState
            title={'No ' + module.toLowerCase() + ' records'}
            description={'New ' + module.toLowerCase() + ' activity attached to this employee will appear here.'}
          />
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {items.map(item => (
            <li key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <time className="text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleDateString()}</time>
                </div>
                <HrisStatusBadge value={item.status} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {Object.entries(item.details || {}).map(([key, value]) => formatValue(value) && (
                  <div key={key}><dt className="text-xs capitalize text-muted-foreground">{key.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)}</dt><dd>{formatValue(value)}</dd></div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
