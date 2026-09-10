"use client";

import * as React from 'react';
import {
  ArrowDownTrayIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ContractFiltersBar, ContractViewSwitcher } from './ContractMonitoringParts';
import { ContractTableView } from './ContractTableView';
import { ContractTimelineView } from './ContractTimelineView';
import type { ContractEmployee, ContractEmployeeWithExpiry, ContractFilters, ContractView } from './contract-monitoring-types';
import { employeeName, enrichContracts } from './contract-monitoring-utils';
import { ContractWorkflowView } from './ContractWorkflowView';

interface MonitoringApiResponse {
  data?: ContractEmployee[];
  error?: { message?: string };
}

const initialFilters: ContractFilters = { query: '', employmentType: 'all', client: 'all', location: 'all', state: 'all' };
const contractsPerPage = 10;

export function ContractMonitoringPage() {
  const [contracts, setContracts] = React.useState<ContractEmployeeWithExpiry[]>([]);
  const [filters, setFilters] = React.useState<ContractFilters>(initialFilters);
  const [view, setView] = React.useState<ContractView>('table');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [creatingAlerts, setCreatingAlerts] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [timelineMonth, setTimelineMonth] = React.useState(() => new Date().toISOString().slice(0, 7));
  const [loadVersion, setLoadVersion] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch('/api/hr/contracts/monitoring', { credentials: 'include', signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const payload = await response.json().catch(() => ({})) as MonitoringApiResponse;
        if (!response.ok) throw new Error(payload.error?.message || 'Unable to load contract monitoring data.');
        return payload;
      })
      .then(payload => {
        const enriched = enrichContracts(payload.data || [], new Date());
        setContracts(enriched);
        setSelectedId(enriched[0]?.id || null);
      })
      .catch(loadError => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load contract employees.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [loadVersion]);

  const filtered = React.useMemo(() => contracts.filter(contract => {
    const haystack = [employeeName(contract), contract.employeeNumber, contract.email, contract.jobTitle, contract.clientName, contract.departmentName, contract.location].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !filters.query.trim() || haystack.includes(filters.query.trim().toLowerCase());
    const matchesType = filters.employmentType === 'all' || contract.employmentType === filters.employmentType;
    const owner = contract.clientName || contract.departmentName || '';
    const matchesClient = filters.client === 'all' || owner === filters.client;
    const matchesLocation = filters.location === 'all' || contract.location === filters.location;
    const matchesState = filters.state === 'all'
      || (filters.state === 'attention' && ['due', 'expired', 'missing_end_date'].includes(contract.expiry.state))
      || contract.expiry.state === filters.state;
    return matchesQuery && matchesType && matchesClient && matchesLocation && matchesState;
  }), [contracts, filters]);

  React.useEffect(() => {
    if (selectedId && !filtered.some(contract => contract.id === selectedId)) setSelectedId(filtered[0]?.id || null);
  }, [filtered, selectedId]);

  const selected = filtered.find(contract => contract.id === selectedId) || null;
  const timelineContracts = React.useMemo(() => contracts.filter(contract => {
    const relevantDate = contract.endDate || contract.hireDate;
    return !timelineMonth || relevantDate?.slice(0, 7) === timelineMonth;
  }), [contracts, timelineMonth]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / contractsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * contractsPerPage;
  const pagedContracts = filtered.slice(pageStart, pageStart + contractsPerPage);

  React.useEffect(() => {
    setPage(1);
  }, [filters.client, filters.employmentType, filters.location, filters.query, filters.state]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const summary = React.useMemo(() => contracts.reduce((result, contract) => {
    if (['due', 'expired', 'missing_end_date'].includes(contract.expiry.state)) result.attention += 1;
    if (contract.expiry.state === 'due') result.due += 1;
    if (contract.expiry.state === 'expired') result.expired += 1;
    if (contract.expiry.state === 'missing_end_date') result.missing += 1;
    return result;
  }, { attention: 0, due: 0, expired: 0, missing: 0 }), [contracts]);

  function selectSummary(state: string) {
    setFilters(current => ({ ...current, state: current.state === state ? 'all' : state }));
  }

  function changeView(nextView: ContractView) {
    setView(nextView);
    if (nextView === 'timeline') setSelectedId(null);
  }

  function changePage(nextPage: number) {
    setPage(Math.max(1, Math.min(totalPages, nextPage)));
    setSelectedId(null);
  }

  async function createAlerts() {
    setCreatingAlerts(true); setNotice('');
    try {
      const response = await fetch('/api/hr/contract-alerts', { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as { created?: number; skipped?: number; message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to create contract alerts.');
      setNotice(`${payload.created || 0} alerts created${payload.skipped ? ` · ${payload.skipped} already existed` : ''}.`);
    } catch (alertError) { setNotice(alertError instanceof Error ? alertError.message : 'Unable to create contract alerts.'); }
    finally { setCreatingAlerts(false); }
  }

  function exportCsv() {
    const headers = ['Employee number', 'Employee', 'Employment type', 'Client', 'Department', 'Contract end', 'Notice days', 'Days remaining', 'Status'];
    const rows = filtered.map(contract => [contract.employeeNumber, employeeName(contract), contract.employmentType, contract.clientName || '', contract.departmentName || '', contract.endDate || '', contract.expiry.noticeDays || '', contract.expiry.daysRemaining ?? '', contract.expiry.state]);
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `contract-monitoring-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="flex min-h-[calc(100dvh-7rem)] flex-col overflow-hidden bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-5 py-4 lg:px-6">
        <div className={cn('min-w-0', view === 'timeline' ? 'shrink-0' : 'flex-1')}><h1 className="text-[22px] font-semibold tracking-[-0.03em]">{view === 'timeline' ? 'Contract timeline' : 'Contract monitoring'}</h1><p className="mt-1 text-sm text-muted-foreground">{view === 'timeline' ? 'Plan renewals before notice windows close' : 'Monitor contractor, subcontract, intern, and part-time employee agreements.'}</p></div>
        <p className={cn('hidden items-center gap-2 text-xs text-muted-foreground md:flex', view === 'timeline' && 'border-l border-border pl-5')}><CalendarDaysIcon className="h-4 w-4" />{new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</p>
        <div className="flex-1" />
        <ContractViewSwitcher value={view} onChange={changeView} />
        <Button type="button" onClick={() => void createAlerts()} disabled={creatingAlerts}><BellAlertIcon className="mr-2 h-4 w-4" />{creatingAlerts ? 'Creating…' : 'Create alerts'}</Button>
        {view === 'timeline' && <label className="relative"><CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Timeline month" type="month" value={timelineMonth} onChange={event => setTimelineMonth(event.target.value)} className="h-9 w-44 pl-9" /></label>}
        <Button type="button" variant="outline" onClick={exportCsv}><ArrowDownTrayIcon className="mr-2 h-4 w-4" />Export</Button>
      </header>

      {view !== 'timeline' && <section className="grid shrink-0 grid-cols-2 border-b border-border bg-card lg:grid-cols-4">
        <SummaryButton label="Needs attention" value={summary.attention} active={filters.state === 'attention'} onClick={() => selectSummary('attention')} icon={ExclamationTriangleIcon} tone="amber" />
        <SummaryButton label="Within notice period" value={summary.due} active={filters.state === 'due'} onClick={() => selectSummary('due')} icon={CalendarDaysIcon} tone="amber" />
        <SummaryButton label="Expired" value={summary.expired} active={filters.state === 'expired'} onClick={() => selectSummary('expired')} icon={XCircleIcon} tone="red" />
        <SummaryButton label="Missing end date" value={summary.missing} active={filters.state === 'missing_end_date'} onClick={() => selectSummary('missing_end_date')} icon={InformationCircleIcon} tone="blue" />
      </section>}

      {notice && <div role="status" className="border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">{notice}</div>}
      {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/10 px-6 py-2 text-xs font-medium text-red-800 dark:text-red-200"><span>{error}</span><Button type="button" variant="outline" size="sm" className="h-8 border-red-500/30 bg-background" onClick={() => { setError(''); setLoading(true); setLoadVersion(version => version + 1); }}>Try again</Button></div>}
      {view !== 'timeline' && <ContractFiltersBar filters={filters} onChange={setFilters} contracts={contracts} />}

      {loading ? <LoadingState /> : view === 'table'
        ? <ContractTableView contracts={pagedContracts} selected={selected} onSelect={employee => setSelectedId(employee?.id || null)} />
        : view === 'timeline'
          ? <ContractTimelineView contracts={timelineContracts} selected={selected} onSelect={employee => setSelectedId(employee?.id || null)} />
          : <ContractWorkflowView contracts={filtered} selected={selected} onSelect={employee => setSelectedId(employee?.id || null)} />}
      {view === 'table'
        ? <ContractPagination currentPage={currentPage} pageSize={contractsPerPage} totalItems={filtered.length} totalPages={totalPages} onChange={changePage} />
        : view !== 'timeline' && <footer className="flex shrink-0 items-center justify-between border-t border-border bg-card px-5 py-2 text-[11px] text-muted-foreground"><span>Showing {filtered.length} of {contracts.length} contract employees</span><span>Alerts use each employee&apos;s configured notice period.</span></footer>}
    </main>
  );
}

function SummaryButton({ label, value, active, onClick, icon: Icon, tone }: { label: string; value: number; active: boolean; onClick: () => void; icon: typeof CalendarDaysIcon; tone: 'amber' | 'red' | 'blue' }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn('flex min-h-20 items-center gap-3 border-r border-border px-5 text-left transition-colors hover:bg-muted/30 last:border-r-0', active && 'bg-primary/10')}><span className={cn('grid h-10 w-10 place-items-center rounded-full', tone === 'amber' && 'bg-amber-500/15 text-amber-600 dark:text-amber-300', tone === 'red' && 'bg-red-500/15 text-red-600 dark:text-red-300', tone === 'blue' && 'bg-blue-500/15 text-blue-600 dark:text-blue-300')}><Icon className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-1 block text-2xl font-semibold tabular-nums">{value}</span></span></button>;
}

function LoadingState() { return <div className="flex-1 p-5"><div className="space-y-3">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />)}</div></div>; }

function ContractPagination({ currentPage, pageSize, totalItems, totalPages, onChange }: { currentPage: number; pageSize: number; totalItems: number; totalPages: number; onChange: (page: number) => void }) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-2.5 text-xs text-muted-foreground">
      <span>Showing <strong className="font-semibold text-foreground">{firstItem}-{lastItem}</strong> of <strong className="font-semibold text-foreground">{totalItems}</strong> contract employees</span>
      <nav aria-label="Contract employee pages" className="flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" className="h-8 px-2.5" onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeftIcon className="mr-1 h-4 w-4" />Previous</Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => <Button key={pageNumber} type="button" variant={pageNumber === currentPage ? 'default' : 'ghost'} size="sm" className="h-8 min-w-8 px-2" aria-label={`Page ${pageNumber}`} aria-current={pageNumber === currentPage ? 'page' : undefined} onClick={() => onChange(pageNumber)}>{pageNumber}</Button>)}
        <Button type="button" variant="outline" size="sm" className="h-8 px-2.5" onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}>Next<ChevronRightIcon className="ml-1 h-4 w-4" /></Button>
      </nav>
    </footer>
  );
}
