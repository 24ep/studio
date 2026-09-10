"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BarChart3,
  CalendarRange,
  ClipboardCheck,
  FileClock,
  FilePlus2,
  History,
  Info,
  LayoutDashboard,
  MessageSquareText,
  RefreshCw,
  Search,
  Scale,
  ShieldCheck,
  Users,
  WifiOff,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { HrisWorkspaceHeader } from '@/components/hris/HrisWorkspacePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AppraisalWorkspaceData } from '@/lib/appraisal/appraisal-contracts';
import { useLocalization } from '@/contexts/LocalizationContext';
import { cn } from '@/lib/utils';
import { AppraisalActionSheet, type AppraisalActionMode } from './AppraisalActionSheet';
import { AppraisalReviewDesk } from './AppraisalReviewDesk';
import {
  AppraisalOverview,
  AuditHistoryView,
  CalibrationView,
  CyclesView,
  FeedbackRequestsView,
  MyAppraisalsView,
  ReportsView,
  TeamAppraisalsView,
  TemplatesView,
} from './AppraisalViews';
import { AppraisalError, AppraisalLoading } from './appraisal-ui';
import { APPRAISAL_REVIEW_DESK_PREVIEW_DATA } from './appraisal-review-desk-preview';

const tabDefinitions = [
  { value: 'overview', label: 'Overview', labelKey: 'appraisal.workspace.tabs.overview', icon: LayoutDashboard },
  { value: 'my-reviews', label: 'My appraisals', labelKey: 'appraisal.workspace.tabs.myAppraisals', icon: ClipboardCheck },
  { value: 'feedback', label: 'Feedback requests', labelKey: 'appraisal.workspace.tabs.feedback', icon: MessageSquareText },
  { value: 'team', label: 'Team appraisals', labelKey: 'appraisal.workspace.tabs.team', icon: Users, roles: ['manager', 'hr', 'administrator'] },
  { value: 'calibration', label: 'Calibration', labelKey: 'appraisal.workspace.tabs.calibration', icon: Scale, permission: 'canCalibrate' },
  { value: 'cycles', label: 'Cycles', labelKey: 'appraisal.workspace.tabs.cycles', icon: CalendarRange, permission: 'canManage' },
  { value: 'templates', label: 'Templates & ratings', labelKey: 'appraisal.workspace.tabs.templates', icon: FileClock, permission: 'canManage' },
  { value: 'reports', label: 'Reports', labelKey: 'appraisal.workspace.tabs.reports', icon: BarChart3, permission: 'canViewReports' },
  { value: 'audit', label: 'Audit history', labelKey: 'appraisal.workspace.tabs.auditHistory', icon: History, permission: 'canManage' },
] as const;

async function responseMessage(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null) as { message?: string } | null;
  return payload?.message || fallback;
}

export function AppraisalWorkspace({
  embedded = false,
  employee = null,
}: {
  embedded?: boolean;
  employee?: { id: string; name: string; employeeNumber?: string | null } | null;
} = {}) {
  const { t } = useLocalization();
  const Root = embedded ? 'section' : 'main';
  const searchParams = useSearchParams();
  const tabs = React.useMemo(() => tabDefinitions.map(tab => ({ ...tab, label: t(tab.labelKey, tab.label) })), [t]);
  const requestedTab = searchParams.get(embedded ? 'appraisalTab' : 'tab');
  const previewMode = searchParams.get('preview') === '1';
  const [data, setData] = React.useState<AppraisalWorkspaceData | null>(previewMode ? APPRAISAL_REVIEW_DESK_PREVIEW_DATA : null);
  const [loading, setLoading] = React.useState(!previewMode);
  const [backgroundLoading, setBackgroundLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [offline, setOffline] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>(requestedTab && tabs.some(tab => tab.value === requestedTab) ? requestedTab : 'team');
  const [actionMode, setActionMode] = React.useState<AppraisalActionMode | null>(null);
  const [actionRecord, setActionRecord] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const load = React.useCallback(async (background = false) => {
    if (previewMode) {
      setData(APPRAISAL_REVIEW_DESK_PREVIEW_DATA);
      setLoading(false);
      setBackgroundLoading(false);
      return;
    }
    background ? setBackgroundLoading(true) : setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/appraisal', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await responseMessage(response, t('appraisal.workspace.errors.loadFailed', 'Unable to load Appraisal.')));
      const payload = await response.json() as { data: AppraisalWorkspaceData };
      setData(payload.data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t('appraisal.workspace.errors.loadFailed', 'Unable to load Appraisal.');
      setError(message);
      if (!background) setData(null);
    } finally {
      setLoading(false);
      setBackgroundLoading(false);
    }
  }, [previewMode, t]);

  React.useEffect(() => {
    void load(false);
  }, [load]);

  const submitAction = React.useCallback(async (body: Record<string, unknown>, successMessage: string) => {
    if (saving || offline) return false;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/appraisal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await responseMessage(response, t('appraisal.workspace.errors.actionFailed', 'Unable to complete the appraisal action.')));
      toast.success(successMessage);
      await load(true);
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t('appraisal.workspace.errors.actionFailed', 'Unable to complete the appraisal action.');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [load, offline, saving, t]);

  const autosaveAction = React.useCallback(async (body: Record<string, unknown>) => {
    if (offline) return false;
    try {
      const response = await fetch('/api/appraisal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, [offline]);

  const openAction = React.useCallback((mode: AppraisalActionMode, record?: Record<string, unknown>) => {
    setActionMode(mode);
    setActionRecord(record || null);
  }, []);

  const sendReminders = React.useCallback(async (reviews: Array<Record<string, unknown>>) => {
    const reviewIds = reviews.map(review => String(review.id || '')).filter(Boolean);
    if (!reviewIds.length) {
      toast.error(t('appraisal.workspace.reminders.none', 'No matching reviews need a reminder.'));
      return false;
    }
    return submitAction(
      { action: 'send_reminders', reviewIds },
      `${t('appraisal.workspace.reminders.sentPrefix', 'Appraisal reminders sent for')} ${reviewIds.length} ${reviewIds.length === 1 ? t('appraisal.workspace.reminders.review', 'review') : t('appraisal.workspace.reminders.reviews', 'reviews')}.`,
    );
  }, [submitAction, t]);

  if (loading) return <AppraisalLoading />;
  if (!data) {
    return (
      <Root className="min-h-full w-full bg-background px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <AppraisalError message={error || t('appraisal.workspace.unavailable', 'Appraisal is currently unavailable.')} onRetry={() => void load(false)} />
        </div>
      </Root>
    );
  }

  const visibleTabs = tabs.filter(tab => {
    if ('roles' in tab && tab.roles && !tab.roles.includes(data.permissions.role as never)) return false;
    if ('permission' in tab && tab.permission && !data.permissions[tab.permission]) return false;
    if (tab.value === 'feedback' && !data.reviewerAssignments.length && data.permissions.role === 'employee') return false;
    return true;
  });
  const safeTab = visibleTabs.some(tab => tab.value === activeTab) ? activeTab : 'overview';
  const primaryTabs = visibleTabs.filter(tab => ['overview', 'my-reviews', 'feedback', 'team'].includes(tab.value));
  const secondaryTabs = visibleTabs.filter(tab => !['overview', 'my-reviews', 'feedback', 'team'].includes(tab.value));
  const currentCycle = data.cycles[0];

  if (embedded && employee) {
    return (
      <Root className="min-h-full w-full bg-background text-foreground">
        {offline ? (
          <div role="status" className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
            <WifiOff className="h-4 w-4" aria-hidden />
            {t('appraisal.workspace.offlineMessage', 'You are offline. Existing appraisal data remains visible; write actions are paused.')}
          </div>
        ) : null}
        {error ? <AppraisalError message={error} onRetry={() => void load(true)} /> : null}
        <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Appraisal <span className="mx-2 text-slate-600">/</span> {String(currentCycle?.name || 'Current review cycle')}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{employee.name}&apos;s appraisal</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatWorkspaceDate(currentCycle?.startDate)} – {formatWorkspaceDate(currentCycle?.endDate)}</span>
            <Button variant="outline" size="sm" className="rounded border-slate-700 bg-transparent" onClick={() => void load(true)} disabled={backgroundLoading}>
              <RefreshCw className={cn('mr-2 h-3.5 w-3.5', backgroundLoading && 'animate-spin')} />{t('appraisal.workspace.refresh', 'Refresh')}
            </Button>
          </div>
        </header>

        <AppraisalReviewDesk data={data} onAction={openAction} employee={employee} showDirectory={false} />

        <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />{t('appraisal.workspace.footer.permissions', 'Company, hierarchy, record, field, reviewer, and release-stage permissions are enforced by the API.')}</p>
        </footer>

        <AppraisalActionSheet
          mode={actionMode}
          record={actionRecord}
          data={data}
          saving={saving}
          onClose={() => { setActionMode(null); setActionRecord(null); void load(true); }}
          onSubmit={submitAction}
          onAutosave={autosaveAction}
        />
      </Root>
    );
  }

  return (
    <Root className="min-h-full w-full bg-background text-foreground">
      <div className="w-full">
        {offline ? (
          <div role="status" className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
            <WifiOff className="h-4 w-4" aria-hidden />
            {t('appraisal.workspace.offlineMessage', 'You are offline. Existing appraisal data remains visible; write actions are paused.')}
          </div>
        ) : null}
        {error ? <AppraisalError message={error} onRetry={() => void load(true)} /> : null}
        {data.meta.partial ? (
          <div role="status" className="border-b border-blue-200 bg-blue-50 px-5 py-3 text-sm text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-200">
            {t('appraisal.workspace.partialMessagePrefix', 'Some appraisal sources are unavailable:')} {data.meta.unavailableSources.join(', ')}. {t('appraisal.workspace.partialMessageSuffix', 'Available records are shown without invented statistics.')}
          </div>
        ) : null}

        <div className="min-h-full border-y border-border">
          <div className="min-w-0">
            <div className="relative overflow-hidden border-b border-border bg-background">
              <div className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Appraisal <span className="mx-2 text-slate-600">/</span> {String(currentCycle?.name || 'Current review cycle')}</p>
                  <h1 className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">Review desk <Info className="h-4 w-4 text-muted-foreground" aria-hidden /></h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Review period: {formatWorkspaceDate(currentCycle?.startDate)} – {formatWorkspaceDate(currentCycle?.endDate)}</span>
                  <Button variant="outline" size="sm" className="rounded border-slate-700 bg-transparent" onClick={() => void load(true)} disabled={backgroundLoading}>
                    <RefreshCw className={cn('mr-2 h-3.5 w-3.5', backgroundLoading && 'animate-spin')} />{t('appraisal.workspace.refresh', 'Refresh')}
                  </Button>
                </div>
              </div>
            </div>

            <Tabs value={safeTab} onValueChange={setActiveTab} className="space-y-0">
              <nav aria-label={t('appraisal.workspace.navAria', 'Appraisal sections')} className="-mt-px overflow-x-auto border-b border-border bg-background px-5">
                <TabsList className="h-auto min-w-max justify-start gap-5 bg-transparent p-0">
                  {primaryTabs.map(tab => {
                    const Icon = tab.icon;
                    const count = tab.value === 'feedback'
                      ? data.reviewerAssignments.filter(item => item.status !== 'submitted').length
                      : tab.value === 'team'
                        ? data.teamReviews.filter(item => !item.releasedAt).length
                        : 0;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="relative min-h-12 gap-2 rounded-none px-1 text-xs font-semibold text-slate-500 shadow-none transition-colors after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#3459a8] after:opacity-0 hover:text-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-[#263f73] data-[state=active]:shadow-none data-[state=active]:after:opacity-100 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-blue-200 dark:data-[state=active]:after:bg-blue-400"
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>{tab.label}</span>
                        {count ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">{count}</span> : null}
                      </TabsTrigger>
                    );
                  })}
                  {secondaryTabs.length ? (
                    <select
                      aria-label="More appraisal sections"
                      value={secondaryTabs.some(tab => tab.value === safeTab) ? safeTab : ''}
                      onChange={event => event.target.value && setActiveTab(event.target.value)}
                      className="min-h-10 border-0 bg-transparent px-1 text-xs font-semibold text-slate-500 outline-none dark:text-slate-400"
                    >
                      <option value="">More</option>
                      {secondaryTabs.map(tab => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
                    </select>
                  ) : null}
                </TabsList>
              </nav>

              <TabsContent value="overview" className="mt-0"><AppraisalOverview data={data} onAction={openAction} onTabChange={setActiveTab} /></TabsContent>
              <TabsContent value="my-reviews" className="mt-0"><MyAppraisalsView data={data} onAction={openAction} /></TabsContent>
              <TabsContent value="feedback" className="mt-0"><FeedbackRequestsView data={data} onAction={openAction} /></TabsContent>
              <TabsContent value="team" className="mt-0"><TeamAppraisalsView data={data} onAction={openAction} onRemind={sendReminders} reminding={saving} /></TabsContent>
              <TabsContent value="calibration" className="mt-0"><CalibrationView data={data} onAction={openAction} /></TabsContent>
              <TabsContent value="cycles" className="mt-0"><CyclesView data={data} onAction={openAction} /></TabsContent>
              <TabsContent value="templates" className="mt-0"><TemplatesView data={data} onAction={openAction} /></TabsContent>
              <TabsContent value="reports" className="mt-0"><ReportsView data={data} /></TabsContent>
              <TabsContent value="audit" className="mt-0"><AuditHistoryView data={data} /></TabsContent>
            </Tabs>

            <footer className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />{t('appraisal.workspace.footer.permissions', 'Company, hierarchy, record, field, reviewer, and release-stage permissions are enforced by the API.')}</p>
              <p>{t('appraisal.workspace.footer.integrations', 'Goal is the source of truth for progress. Performance owns continuous conversations. Learning owns courses.')}</p>
            </footer>
          </div>
        </div>
      </div>

      <AppraisalActionSheet
        mode={actionMode}
        record={actionRecord}
        data={data}
        saving={saving}
        onClose={() => { setActionMode(null); setActionRecord(null); void load(true); }}
        onSubmit={submitAction}
        onAutosave={autosaveAction}
      />
    </Root>
  );
}

function AppraisalScopeSidebar({
  data,
  activeTab,
  onOpenTab,
}: {
  data: AppraisalWorkspaceData;
  activeTab: string;
  onOpenTab: (tab: string) => void;
}) {
  const { t } = useLocalization();
  const [query, setQuery] = React.useState('');
  const teamScope = data.teamReviews.length > 0 && data.permissions.role !== 'employee';
  const targetTab = teamScope ? 'team' : 'my-reviews';
  const source = teamScope ? data.teamReviews : data.reviews;
  const people = Array.from(source.reduce((items, row) => {
    const key = String(row.employeeId || row.id);
    if (!items.has(key)) items.set(key, row);
    return items;
  }, new Map<string, Record<string, unknown>>()).values());
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePeople = normalizedQuery
    ? people.filter(person => [person.employeeName, person.employeeNumber, person.jobTitle, person.department, person.cycleName]
      .some(value => String(value || '').toLowerCase().includes(normalizedQuery)))
    : people;

  return (
    <aside aria-label={t('appraisal.workspace.scopeAria', 'Appraisal scope')} className="hidden min-h-full overflow-hidden bg-background lg:flex lg:flex-col">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{teamScope ? t('appraisal.workspace.scope.population', 'Review population') : t('appraisal.workspace.scope.myAppraisals', 'My appraisals')}</p>
            <p className="mt-0.5 text-xs text-slate-500">{people.length} {teamScope ? t('appraisal.workspace.scope.inScope', 'in your scope') : t('appraisal.workspace.scope.assigned', 'assigned to you')}</p>
          </div>
          <ClipboardCheck className="h-5 w-5 text-[#3459a8] dark:text-blue-300" aria-hidden />
        </div>
        {people.length > 5 ? (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={teamScope ? t('appraisal.workspace.scope.searchEmployeesPlaceholder', 'Search employees') : t('appraisal.workspace.scope.searchAppraisalsPlaceholder', 'Search appraisals')}
              aria-label={teamScope ? t('appraisal.workspace.scope.searchEmployeesLabel', 'Search appraisal employees') : t('appraisal.workspace.scope.searchAppraisalsLabel', 'Search appraisals')}
              className="h-9 pl-9"
            />
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {visiblePeople.length ? (
          <div className="space-y-1">
            {visiblePeople.map((person, index) => (
              <button
                key={String(person.employeeId || person.id || index)}
                type="button"
                onClick={() => onOpenTab(targetTab)}
                aria-current={activeTab === targetTab && index === 0 ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3459a8]',
                  activeTab === targetTab && index === 0
                    ? 'bg-[#eef3ff] text-[#263f73] dark:bg-blue-950/40 dark:text-blue-100'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900',
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 border border-slate-200 dark:border-slate-700">
                  {person.profilePhotoUrl ? <AvatarImage src={String(person.profilePhotoUrl)} alt="" /> : null}
                  <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{initials(String(person.employeeName || t('appraisal.workspace.fallback.employee', 'Employee')))}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{String(person.employeeName || person.cycleName || t('appraisal.workspace.fallback.appraisal', 'Appraisal'))}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {teamScope
                      ? String(person.jobTitle || person.department || person.employeeNumber || t('appraisal.workspace.fallback.employee', 'Employee'))
                      : `${String(person.cycleName || t('appraisal.workspace.fallback.review', 'Review'))} · ${labelValue(person.reviewType, t('appraisal.workspace.fallback.review', 'Review'))}`
                    }
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-slate-500">{t('appraisal.workspace.scope.noMatch', 'No appraisal records match your search.')}</p>
        )}
      </div>
    </aside>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function labelValue(value: unknown, fallback: string) {
  return String(value || fallback).replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function formatWorkspaceDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Not configured';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}
