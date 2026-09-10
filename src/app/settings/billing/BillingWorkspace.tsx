"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import type { CoreBillingPreferences, HriveCommercialOverview } from '@/lib/outborn-core/commercial-types';
import { cn } from '@/lib/utils';
import {
  BillingDetailsPanel,
  InvoicesPanel,
  OverviewPanel,
  PlanPanel,
  UsagePanel,
} from './BillingWorkspacePanels';
import {
  billingTabs,
  canManageBilling,
  findHriveSubscription,
  getHriveSubscriptionItems,
  type BillingTab,
} from './billing-workspace-model';

export function BillingWorkspace() {
  const [tab, setTab] = useState<BillingTab>('overview');
  const [overview, setOverview] = useState<HriveCommercialOverview | null>(null);
  const [draft, setDraft] = useState<CoreBillingPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/outborn-core/commercial', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as HriveCommercialOverview & { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to load billing.');
      setOverview(payload);
      setDraft(payload.preferences);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load billing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const subscription = useMemo(() => findHriveSubscription(overview?.billing ?? null), [overview]);
  const planItems = useMemo(() => getHriveSubscriptionItems(subscription), [subscription]);
  const canManage = canManageBilling(overview?.organizationRole);
  const dirty = Boolean(draft && overview && JSON.stringify(draft) !== JSON.stringify(overview.preferences));

  const updateDraft = <K extends keyof CoreBillingPreferences>(
    key: K,
    value: CoreBillingPreferences[K],
  ) => {
    setDraft(current => current ? { ...current, [key]: value } : current);
  };

  const savePreferences = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const response = await fetch('/api/outborn-core/commercial/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const payload = await response.json().catch(() => ({})) as CoreBillingPreferences & { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to save billing details.');
      setDraft(payload);
      setOverview(current => current ? { ...current, preferences: payload } : current);
      toast.success('Billing details saved in Outborn Core.');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save billing details.');
    } finally {
      setSaving(false);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const response = await fetch('/api/outborn-core/commercial/portal', { method: 'POST' });
      const payload = await response.json().catch(() => ({})) as { url?: string; message?: string };
      if (!response.ok || !payload.url) throw new Error(payload.message || 'Billing portal is unavailable.');
      window.location.assign(payload.url);
    } catch (portalError) {
      toast.error(portalError instanceof Error ? portalError.message : 'Billing portal is unavailable.');
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="grid h-full min-h-[520px] place-items-center bg-[#f5f7fa] dark:bg-[#0b1118]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !overview || !draft) {
    return (
      <div className="grid h-full min-h-[520px] place-items-center bg-[#f5f7fa] p-6 dark:bg-[#0b1118]">
        <div className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold">Commercial services are not available</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error || 'Unable to load Outborn Core.'}</p>
          <Button className="mt-4" variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-[#f5f7fa] text-slate-950 dark:bg-[#0b1118] dark:text-zinc-100">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-[-0.02em]">Billing & plan</h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">Outborn Core</span>
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-600 dark:text-zinc-400">
                {overview.organizationName || 'Your organization'} · plan, limits, usage and invoices are managed by the shared Outborn commercial platform.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-1.5 h-4 w-4" />Refresh
            </Button>
            {canManage && (
              <Button size="sm" disabled={openingPortal || !overview.billing} onClick={() => void openPortal()}>
                {openingPortal
                  ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  : <ExternalLink className="mr-1.5 h-4 w-4" />}
                Manage billing
              </Button>
            )}
          </div>
        </header>

        <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-zinc-800" aria-label="Billing sections">
          {billingTabs.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && <OverviewPanel overview={overview} subscription={subscription} planItems={planItems} />}
        {tab === 'plan' && <PlanPanel subscription={subscription} items={planItems} entitlements={overview.entitlements} />}
        {tab === 'usage' && <UsagePanel overview={overview} />}
        {tab === 'invoices' && <InvoicesPanel invoices={overview.billing?.invoices ?? []} />}
        {tab === 'details' && (
          <BillingDetailsPanel
            value={draft}
            dirty={dirty}
            saving={saving}
            canManage={canManage}
            onChange={updateDraft}
            onReset={() => setDraft(overview.preferences)}
            onSave={() => void savePreferences()}
          />
        )}
      </div>
    </main>
  );
}
