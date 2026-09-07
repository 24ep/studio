'use client';

import * as React from 'react';
import { Download, FileText, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusBadge } from './EssShared';

type Payslip = {
  id: string;
  status?: string;
  published_at?: string | null;
  created_at?: string | null;
  period_name?: string | null;
  pay_date?: string | null;
  currency?: string | null;
  net_pay?: string | number | null;
};

function periodLabel(item: Payslip) {
  if (item.period_name) return item.period_name;
  const date = new Date(String(item.pay_date || item.published_at || item.created_at || ''));
  return Number.isNaN(date.getTime())
    ? 'Payslip'
    : new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

function money(item: Payslip) {
  if (item.net_pay === null || item.net_pay === undefined) return null;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: item.currency || 'THB',
    maximumFractionDigits: 2,
  }).format(Number(item.net_pay || 0));
}

export function PayslipsView() {
  const [items, setItems] = React.useState<Payslip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ess/payslips', { credentials: 'include', cache: 'no-store' });
      const body = await response.json() as { data?: { payslips?: Payslip[] }; message?: string };
      if (!response.ok) throw new Error(body.message || 'Unable to load your payslips.');
      setItems(body.data?.payslips || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your payslips.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-5xl space-y-4">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Employee self-service</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">My payslips</h1>
            <p className="mt-1 text-sm text-muted-foreground">View released payroll statements through your secure employee account.</p>
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Refresh payslips" onClick={() => void load(true)}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}

        {loading ? (
          <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading payslips" /></div>
        ) : items.length === 0 ? (
          <section className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <FileText className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">No released payslips yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Payroll statements will appear here as soon as Payroll releases them.</p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Released payslips">
            <div className="divide-y divide-border">
              {items.map(item => (
                <article key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <h2 className="font-medium">{periodLabel(item)}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Released {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'date unavailable'}
                        {money(item) ? ` · Net ${money(item)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status || 'released'} />
                    <Button asChild variant="outline" className="min-h-11">
                      <a href={`/api/payroll/v1/payslips/${encodeURIComponent(item.id)}`} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" /> View payslip
                      </a>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
