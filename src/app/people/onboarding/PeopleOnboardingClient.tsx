"use client";

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { isAdminUser } from '@/lib/permissions';

type RecordItem = Record<string, unknown> & { id: string };
type ResourceResponse = { resource?: { records?: RecordItem[] }; records?: RecordItem[]; data?: RecordItem };
type JourneyFilter = 'all' | 'needs_action' | 'starting_soon' | 'on_track' | 'completed';
type JourneyGroup = 'needs_action' | 'starting_soon' | 'on_track' | 'completed';
type JourneyStageId = 'personal_information' | 'employment_details' | 'equipment' | 'compliance' | 'orientation';

type JourneyRow = {
  caseItem: RecordItem;
  employee: RecordItem | null;
  employeeId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  role: string;
  department: string;
  location: string;
  owner: string;
  startDate: Date | null;
  startDateLabel: string;
  daysToStart: number | null;
  phase: string;
  progress: number;
  status: string;
  group: JourneyGroup;
  risk: 'high' | 'medium' | 'low' | 'none';
  topBlocker: string;
  nextAction: string;
};

const FILTERS: Array<{ id: JourneyFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'needs_action', label: 'Needs action' },
  { id: 'starting_soon', label: 'Starting soon' },
  { id: 'on_track', label: 'On track' },
  { id: 'completed', label: 'Completed' },
];

const GROUPS: Array<{ id: JourneyGroup; label: string }> = [
  { id: 'needs_action', label: 'Needs action' },
  { id: 'starting_soon', label: 'Starting soon' },
  { id: 'on_track', label: 'On track' },
  { id: 'completed', label: 'Completed' },
];

function records(payload: ResourceResponse) {
  return payload.resource?.records || payload.records || [];
}

function value(record: Record<string, unknown> | null | undefined, camel: string, snake?: string) {
  return record?.[camel] ?? (snake ? record?.[snake] : undefined);
}

function label(valueToFormat: unknown, fallback = '—') {
  return valueToFormat === null || valueToFormat === undefined || valueToFormat === ''
    ? fallback
    : String(valueToFormat).replace(/_/g, ' ');
}

function percentage(valueToFormat: unknown) {
  const parsed = Number(valueToFormat);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 0;
}

function dateValue(valueToParse: unknown) {
  if (!valueToParse) return null;
  const parsed = new Date(String(valueToParse));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateToFormat: Date | null) {
  if (!dateToFormat) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateToFormat);
}

function startDifference(date: Date | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return Math.ceil((normalized.getTime() - today.getTime()) / 86_400_000);
}

function employeeName(employee: RecordItem | null, caseItem: RecordItem) {
  if (!employee) {
    return firstText(caseItem, [['employeeName', 'employee_name'], ['name'], ['title']], 'Employee record');
  }
  const first = label(value(employee, 'preferredName', 'preferred_name'), '') || label(value(employee, 'firstName', 'first_name'), '');
  const last = label(value(employee, 'lastName', 'last_name'), '');
  return `${first} ${last}`.trim() || label(employee.email, 'Employee record');
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'NH';
}

function firstText(record: RecordItem | null, fields: Array<[string, string?]>, fallback: string) {
  for (const [camel, snake] of fields) {
    const candidate = value(record, camel, snake);
    if (candidate !== null && candidate !== undefined && candidate !== '') return label(candidate, fallback);
  }
  return fallback;
}

function journeyPhase(daysToStart: number | null, status: string) {
  if (status === 'completed') return 'Completed';
  if (daysToStart === null || daysToStart > 0) return 'Before start';
  if (daysToStart >= -1) return 'First day';
  if (daysToStart >= -7) return 'First week';
  return 'First 30 days';
}

function buildJourneyRow(caseItem: RecordItem, employees: RecordItem[]): JourneyRow {
  const employeeId = String(value(caseItem, 'employeeId', 'employee_id') || '');
  const employee = employees.find(candidate => candidate.id === employeeId) || null;
  const status = label(caseItem.status, 'not started').toLowerCase();
  const startDate = dateValue(value(caseItem, 'startDate', 'start_date')) || dateValue(value(employee, 'hireDate', 'hire_date'));
  const daysToStart = startDifference(startDate);
  const progress = percentage(caseItem.progress);
  const targetDate = dateValue(value(caseItem, 'targetDate', 'target_date'));
  const targetOverdue = Boolean(targetDate && targetDate.getTime() < Date.now() && status !== 'completed');
  const needsAction = ['blocked', 'at risk', 'at_risk', 'overdue'].includes(status) || targetOverdue || (progress < 50 && daysToStart !== null && daysToStart <= 7);
  const startingSoon = !needsAction && status !== 'completed' && daysToStart !== null && daysToStart >= 0 && daysToStart <= 7;
  const group: JourneyGroup = status === 'completed' ? 'completed' : needsAction ? 'needs_action' : startingSoon ? 'starting_soon' : 'on_track';
  const risk = group === 'needs_action' ? (progress < 35 || targetOverdue ? 'high' : 'medium') : group === 'starting_soon' && progress < 75 ? 'medium' : group === 'completed' ? 'none' : 'low';
  const phase = journeyPhase(daysToStart, status);
  const defaultNextAction = status === 'completed'
    ? 'No action needed'
    : group === 'needs_action'
      ? 'Review overdue tasks'
      : phase === 'Before start'
        ? 'Complete preboarding'
        : phase === 'First week'
          ? 'Review first-week tasks'
          : 'Continue onboarding';
  const nextAction = firstText(caseItem, [['nextAction', 'next_action']], defaultNextAction);
  const topBlocker = firstText(caseItem, [['topBlocker', 'top_blocker'], ['blocker']], group === 'needs_action'
    ? 'Overdue tasks require review'
    : group === 'starting_soon'
      ? 'Preparation due soon'
      : group === 'completed'
        ? 'Journey complete'
        : 'No blockers');
  const name = employeeName(employee, caseItem);

  return {
    caseItem,
    employee,
    employeeId,
    name,
    initials: initials(name),
    avatarUrl: firstText(employee, [['employeeAvatarUrl'], ['accountAvatarUrl'], ['avatarUrl']], '') || null,
    role: firstText(employee, [['jobTitle', 'job_title'], ['positionTitle', 'position_title']], 'Role not set'),
    department: firstText(employee, [['departmentName', 'department_name'], ['department']], 'Unassigned'),
    location: firstText(employee, [['locationName', 'location_name'], ['location']], 'Not set'),
    owner: firstText(caseItem, [['ownerRole', 'owner_role']], 'HR'),
    startDate,
    startDateLabel: formatDate(startDate),
    daysToStart,
    phase,
    progress,
    status,
    group,
    risk,
    topBlocker,
    nextAction,
  };
}

function relativeStart(days: number | null) {
  if (days === null) return 'Date not set';
  if (days === 0) return 'Starts today';
  if (days === 1) return 'Starts tomorrow';
  if (days > 1) return `In ${days} days`;
  if (days === -1) return 'Started yesterday';
  return `Started ${Math.abs(days)} days ago`;
}

export function PeopleOnboardingClient() {
  const { data: session } = useSession();
  const [cases, setCases] = React.useState<RecordItem[]>([]);
  const [employees, setEmployees] = React.useState<RecordItem[]>([]);
  const [tasks, setTasks] = React.useState<RecordItem[]>([]);
  const [templates, setTemplates] = React.useState<RecordItem[]>([]);
  const [courses, setCourses] = React.useState<RecordItem[]>([]);
  const [enrollments, setEnrollments] = React.useState<RecordItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(null);
  const [employeeDetail, setEmployeeDetail] = React.useState<RecordItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<JourneyFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [startDateFilter, setStartDateFilter] = React.useState('all');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [locationFilter, setLocationFilter] = React.useState('all');
  const [ownerFilter, setOwnerFilter] = React.useState('all');
  const [form, setForm] = React.useState({ employeeId: '', templateId: '', startDate: '', targetDate: '' });
  const canManageOnboarding = isAdminUser(session?.user) || (session?.user?.modulePermissions || []).includes('HR_PEOPLE_MANAGE');

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const criticalResponses = await Promise.all([
        fetch('/api/hr/onboarding', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/hr/employees', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/hr/onboarding?view=templates', { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!criticalResponses[0].ok) throw new Error('Unable to load onboarding journeys.');
      const criticalPayloads = await Promise.all(criticalResponses.map(async response => response.ok ? response.json() as Promise<ResourceResponse> : {}));
      const nextCases = records(criticalPayloads[0]);
      setCases(nextCases);
      setEmployees(records(criticalPayloads[1]));
      const nextTemplates = records(criticalPayloads[2]).filter(template => String(value(template, 'isActive', 'is_active')).toLowerCase() === 'true');
      setTemplates(nextTemplates);
      setForm(current => current.templateId || !nextTemplates[0] ? current : { ...current, templateId: nextTemplates[0].id });
      setSelectedCaseId(current => current && nextCases.some(item => item.id === current) ? current : nextCases[0]?.id || null);
      setIsLoading(false);

      void Promise.all([
        fetch('/api/hr/onboarding?view=tasks', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/hr/learning', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/hr/learning?view=courses', { credentials: 'include', cache: 'no-store' }),
      ]).then(async responses => {
        const payloads = await Promise.all(responses.map(async response => response.ok ? response.json() as Promise<ResourceResponse> : {}));
        setTasks(records(payloads[0]));
        setEnrollments(records(payloads[1]));
        setCourses(records(payloads[2]));
      }).catch(() => {
        // The journey list remains usable when enrichment services are unavailable.
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load onboarding journeys.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const rows = React.useMemo(() => cases.map(item => buildJourneyRow(item, employees)), [cases, employees]);
  const selectedRow = rows.find(item => item.caseItem.id === selectedCaseId) || null;
  const selectedEmployeeId = selectedRow?.employeeId || '';

  React.useEffect(() => {
    if (!selectedEmployeeId) {
      setEmployeeDetail(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/hr/employees?id=${encodeURIComponent(selectedEmployeeId)}`, { credentials: 'include', cache: 'no-store' })
      .then(async response => response.ok ? response.json() as Promise<ResourceResponse> : null)
      .then(payload => { if (!cancelled) setEmployeeDetail(payload?.data || null); })
      .catch(() => { if (!cancelled) setEmployeeDetail(null); });
    return () => { cancelled = true; };
  }, [selectedEmployeeId]);

  const detailTasks = React.useMemo(
    () => Array.isArray(employeeDetail?.onboardingTasks)
      ? employeeDetail.onboardingTasks as RecordItem[]
      : tasks.filter(task => String(value(task, 'templateId', 'template_id') || '') === String(value(selectedRow?.caseItem, 'templateId', 'template_id') || '')),
    [employeeDetail, selectedRow?.caseItem, tasks],
  );
  const selectedEnrollments = enrollments.filter(item => value(item, 'employeeId', 'employee_id') === selectedEmployeeId);
  const selectedCourses = selectedEnrollments.map(item => courses.find(course => course.id === String(value(item, 'courseId', 'course_id')))).filter(Boolean);
  const profileFields = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'employmentType', 'departmentId', 'managerId', 'hireDate', 'location'];
  const profileComplete = employeeDetail ? Math.round(profileFields.filter(field => Boolean(value(employeeDetail, field, field.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`)))).length / profileFields.length * 100) : 0;
  const completedTasks = detailTasks.filter(task => label(task.status, 'pending').toLowerCase() === 'completed').length;
  const checklistComplete = detailTasks.length ? Math.round(completedTasks / detailTasks.length * 100) : 0;
  const learningComplete = selectedEnrollments.length ? Math.round(selectedEnrollments.reduce((sum, item) => sum + percentage(item.progress), 0) / selectedEnrollments.length) : 0;
  const selectedProgress = selectedRow ? (selectedRow.progress || Math.round((profileComplete + checklistComplete + learningComplete) / 3)) : 0;

  const handleTaskUpdated = React.useCallback((taskId: string, status: string, progress: number) => {
    setEmployeeDetail(current => {
      if (!current || !Array.isArray(current.onboardingTasks)) return current;
      return {
        ...current,
        onboardingTasks: (current.onboardingTasks as RecordItem[]).map(task => task.id === taskId ? { ...task, status } : task),
      };
    });
    setCases(current => current.map(caseItem => caseItem.id === selectedCaseId
      ? { ...caseItem, progress, status: progress >= 100 ? 'completed' : 'in_progress' }
      : caseItem));
  }, [selectedCaseId]);

  const departments = React.useMemo(() => Array.from(new Set(rows.map(row => row.department))).sort(), [rows]);
  const locations = React.useMemo(() => Array.from(new Set(rows.map(row => row.location))).sort(), [rows]);
  const owners = React.useMemo(() => Array.from(new Set(rows.map(row => row.owner))).sort(), [rows]);
  const counts = React.useMemo(() => Object.fromEntries(FILTERS.map(filter => [filter.id, filter.id === 'all' ? rows.length : rows.filter(row => row.group === filter.id).length])), [rows]);

  const visibleRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter(row => {
      if (activeFilter !== 'all' && row.group !== activeFilter) return false;
      if (startDateFilter !== 'all') {
        if (row.daysToStart === null) return false;
        if (startDateFilter === 'next_7' && (row.daysToStart < 0 || row.daysToStart > 7)) return false;
        if (startDateFilter === 'next_30' && (row.daysToStart < 0 || row.daysToStart > 30)) return false;
        if (startDateFilter === 'this_quarter' && (row.daysToStart < 0 || row.daysToStart > 90)) return false;
      }
      if (departmentFilter !== 'all' && row.department !== departmentFilter) return false;
      if (locationFilter !== 'all' && row.location !== locationFilter) return false;
      if (ownerFilter !== 'all' && row.owner !== ownerFilter) return false;
      return !query || [row.name, row.role, row.department, row.location].some(item => item.toLowerCase().includes(query));
    });
  }, [activeFilter, departmentFilter, locationFilter, ownerFilter, rows, searchQuery, startDateFilter]);

  const submitOnboarding = async () => {
    if (!form.employeeId || !form.templateId) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/hr/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: form.employeeId, templateId: form.templateId, status: 'not_started', progress: 0, startDate: form.startDate || undefined, targetDate: form.targetDate || undefined }),
      });
      if (!response.ok) throw new Error('Unable to start onboarding.');
      setCreateOpen(false);
      setForm({ employeeId: '', templateId: templates[0]?.id || '', startDate: '', targetDate: '' });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to start onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-full bg-[#f8fafc] text-[#14213d] dark:bg-zinc-950 dark:text-zinc-50">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-7">
        <PageHeader canManage={canManageOnboarding} onStart={() => setCreateOpen(true)} />

        {error && <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">{error}</p>}

        {isLoading ? (
          <OnboardingSkeleton />
        ) : rows.length ? (
          <div className="mt-6 min-w-0">
            <div className="min-w-0">
              <StatusOverview activeFilter={activeFilter} counts={counts} onChange={setActiveFilter} />
              <FilterBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                startDate={startDateFilter}
                onStartDate={setStartDateFilter}
                department={departmentFilter}
                onDepartment={setDepartmentFilter}
                departments={departments}
                location={locationFilter}
                onLocation={setLocationFilter}
                locations={locations}
                owner={ownerFilter}
                onOwner={setOwnerFilter}
                owners={owners}
              />
              <JourneyTable
                rows={visibleRows}
                selectedCaseId={drawerOpen ? selectedCaseId : null}
                selectedProgress={selectedProgress}
                onSelect={caseId => { setSelectedCaseId(caseId); setDrawerOpen(true); }}
              />
            </div>
            {drawerOpen && selectedRow && (
              <JourneyDrawer
                open={drawerOpen}
                row={selectedRow}
                employeeDetail={employeeDetail}
                tasks={detailTasks}
                progress={selectedProgress}
                completedTasks={completedTasks}
                courseCount={selectedCourses.length}
                canManage={canManageOnboarding}
                onTaskUpdated={handleTaskUpdated}
                onClose={() => setDrawerOpen(false)}
              />
            )}
          </div>
        ) : (
          <EmptyState canManage={canManageOnboarding} onStart={() => setCreateOpen(true)} />
        )}
      </div>

      <StartOnboardingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        templates={templates}
        setForm={setForm}
        isSaving={isSaving}
        onSubmit={() => void submitOnboarding()}
      />
    </main>
  );
}

function PageHeader({ canManage, onStart }: { canManage: boolean; onStart: () => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.035em]">Onboarding readiness</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Review upcoming hires, prioritize exceptions, and open an employee journey for action.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {canManage && (
          <>
          <Button asChild variant="outline" className="h-10 bg-white dark:bg-zinc-900">
            <Link href="/settings?adminTab=hr-setup&config=onboarding"><Cog6ToothIcon className="mr-2 h-4 w-4" />Configure</Link>
          </Button>
          <Button type="button" onClick={onStart} className="h-10 bg-[#155bd7] px-4 hover:bg-[#104dbb]"><PlusIcon className="mr-2 h-4 w-4" />Start onboarding</Button>
          </>
        )}
      </div>
    </header>
  );
}

function FilterBar({ searchQuery, onSearch, startDate, onStartDate, department, onDepartment, departments, location, onLocation, locations, owner, onOwner, owners }: {
  searchQuery: string;
  onSearch: (value: string) => void;
  startDate: string;
  onStartDate: (value: string) => void;
  department: string;
  onDepartment: (value: string) => void;
  departments: string[];
  location: string;
  onLocation: (value: string) => void;
  locations: string[];
  owner: string;
  onOwner: (value: string) => void;
  owners: string[];
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">Search hires</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={searchQuery} onChange={event => onSearch(event.target.value)} placeholder="Search hires" className="h-9 bg-white pl-9 dark:bg-zinc-900" />
      </label>
      <FilterSelect
        label="Start date"
        value={startDate}
        onChange={onStartDate}
        options={[
          { value: 'next_7', label: 'Next 7 days' },
          { value: 'next_30', label: 'Next 30 days' },
          { value: 'this_quarter', label: 'This quarter' },
        ]}
      />
      <FilterSelect label="Department" value={department} onChange={onDepartment} options={departments} />
      <FilterSelect label="Location" value={location} onChange={onLocation} options={locations} />
      <FilterSelect label="Owner" value={owner} onChange={onOwner} options={owners} />
      <Button type="button" variant="outline" className="h-9 bg-white px-3 dark:bg-zinc-900" aria-label="More filters"><FunnelIcon className="mr-2 h-4 w-4" />Filters</Button>
    </div>
  );
}

function FilterSelect({ label: selectLabel, value: selectValue, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { value: string; label: string }> }) {
  return (
    <label className="relative">
      <span className="sr-only">{selectLabel}</span>
      <select value={selectValue} onChange={event => onChange(event.target.value)} className="h-9 min-w-[145px] appearance-none rounded-md border border-input bg-white pl-3 pr-8 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-zinc-900">
        <option value="all">{selectLabel}: All</option>
        {options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

function JourneyTable({ rows, selectedCaseId, selectedProgress, onSelect }: { rows: JourneyRow[]; selectedCaseId: string | null; selectedProgress: number; onSelect: (caseId: string) => void }) {
  if (!rows.length) {
    return <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-zinc-700 dark:bg-zinc-900"><div><FunnelIcon className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-semibold">No journeys match these filters</h2><p className="mt-1 text-sm text-slate-500">Try widening the status, department, or search filters.</p></div></div>;
  }

  return (
    <section aria-label="Onboarding journeys" className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[minmax(200px,1.25fr)_116px_106px_120px_minmax(160px,1fr)_minmax(145px,0.9fr)_92px] items-center border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            <span>Employee</span><span>Start date</span><span>Phase</span><span>Readiness</span><span>Top blocker</span><span>Next action</span><span>Owner</span>
          </div>
          {GROUPS.map(group => {
            const groupRows = rows.filter(row => row.group === group.id);
            if (!groupRows.length) return null;
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-4 py-2 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-950/25">
                  <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                  <GroupIcon group={group.id} />
                  {group.label} <span className="font-normal text-slate-400">({groupRows.length})</span>
                </div>
                {groupRows.map(row => <JourneyTableRow key={row.caseItem.id} row={row} selected={selectedCaseId === row.caseItem.id} selectedProgress={selectedProgress} onSelect={() => onSelect(row.caseItem.id)} />)}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GroupIcon({ group, className }: { group: JourneyGroup; className?: string }) {
  if (group === 'needs_action') return <ExclamationCircleIcon className={cn('h-4 w-4 text-rose-500', className)} />;
  if (group === 'starting_soon') return <ClockIcon className={cn('h-4 w-4 text-amber-500', className)} />;
  if (group === 'completed') return <CheckCircleIcon className={cn('h-4 w-4 text-slate-400', className)} />;
  return <CheckCircleIcon className={cn('h-4 w-4 text-emerald-500', className)} />;
}

function JourneyTableRow({ row, selected, selectedProgress, onSelect }: { row: JourneyRow; selected: boolean; selectedProgress: number; onSelect: () => void }) {
  const visibleProgress = selected ? selectedProgress : row.progress;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative grid w-full grid-cols-[minmax(200px,1.25fr)_116px_106px_120px_minmax(160px,1fr)_minmax(145px,0.9fr)_92px] items-center border-b border-slate-100 px-4 py-3 text-left text-xs transition-colors last:border-b-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#155bd7] dark:border-zinc-800/70 dark:hover:bg-zinc-800/40',
        selected && 'bg-blue-50/80 hover:bg-blue-50 dark:bg-blue-950/25 dark:hover:bg-blue-950/30',
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#155bd7]" />}
      <span className="flex min-w-0 items-center gap-3 pl-1">
        <span className={cn('h-3 w-3 shrink-0 rounded-full border', selected ? 'border-[#155bd7] ring-2 ring-blue-100 dark:ring-blue-950' : 'border-slate-300 dark:border-zinc-700')} />
        <EmployeeAvatar row={row} size="sm" />
        <span className="min-w-0"><span className="block truncate font-semibold text-slate-900 dark:text-zinc-100">{row.name}</span><span className="mt-0.5 block truncate text-slate-500 dark:text-zinc-400">{row.role}</span></span>
      </span>
      <span><span className="block font-medium">{row.startDateLabel}</span><span className="mt-0.5 block text-slate-500">{relativeStart(row.daysToStart)}</span></span>
      <span><span className="block font-medium">{row.phase}</span><span className="mt-0.5 block text-slate-500 capitalize">{row.status}</span></span>
      <span className="pr-5"><span className="font-semibold tabular-nums">{visibleProgress}%</span><span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700"><span className={cn('block h-full rounded-full', visibleProgress >= 90 ? 'bg-emerald-500' : 'bg-[#155bd7]')} style={{ width: `${visibleProgress}%` }} /></span></span>
      <span className="flex min-w-0 items-start gap-1.5 pr-3"><GroupIcon group={row.group} className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate font-medium">{row.topBlocker}</span><span className="mt-0.5 block truncate text-slate-500">{row.group === 'needs_action' ? 'Needs review' : row.group === 'starting_soon' ? relativeStart(row.daysToStart) : 'Current status'}</span></span></span>
      <span><span className="block truncate font-medium">{row.nextAction}</span><span className="mt-0.5 block truncate text-slate-500">Open journey to review</span></span>
      <span className="capitalize"><span className="block truncate font-medium">{row.owner}</span><span className="mt-0.5 block text-slate-500">Owner</span></span>
    </button>
  );
}

const JOURNEY_STAGES: Array<{ id: JourneyStageId; label: string }> = [
  { id: 'personal_information', label: 'Personal information' },
  { id: 'employment_details', label: 'Employment details' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'orientation', label: 'Orientation' },
];

function journeyStageForTask(task: RecordItem): JourneyStageId {
  const taskText = `${label(task.title, '')} ${label(task.description, '')}`.toLowerCase();
  if (/personal|profile|contact|emergency/.test(taskText)) return 'personal_information';
  if (/employment|contract|payroll|bank|benefit/.test(taskText)) return 'employment_details';
  if (/equipment|laptop|device|hardware|access|account/.test(taskText)) return 'equipment';
  if (/compliance|policy|i-9|tax|document|background|acknowledg/.test(taskText)) return 'compliance';
  return 'orientation';
}

function onboardingTaskDueDate(row: JourneyRow, task: RecordItem | null) {
  if (!task || !row.startDate) return null;
  const dueDay = Number(value(task, 'dueDay', 'due_day') || 0);
  return new Date(row.startDate.getTime() + dueDay * 86_400_000);
}

function JourneyDrawer({ open, row, employeeDetail, tasks, progress, completedTasks, courseCount, canManage, onTaskUpdated, onClose }: {
  open: boolean;
  row: JourneyRow;
  employeeDetail: RecordItem | null;
  tasks: RecordItem[];
  progress: number;
  completedTasks: number;
  courseCount: number;
  canManage: boolean;
  onTaskUpdated: (taskId: string, status: string, progress: number) => void;
  onClose: () => void;
}) {
  const [activeStage, setActiveStage] = React.useState<JourneyStageId | null>(null);
  React.useEffect(() => { setActiveStage(null); }, [row.caseItem.id]);
  const prioritized = [...tasks]
    .filter(task => label(task.status, 'pending').toLowerCase() !== 'completed')
    .sort((a, b) => Number(value(a, 'dueDay', 'due_day') || 0) - Number(value(b, 'dueDay', 'due_day') || 0))
    .slice(0, 5);
  const manager = firstText(employeeDetail, [['managerName', 'manager_name'], ['reportsToName', 'reports_to_name']], 'Not assigned');
  const stageProgress = JOURNEY_STAGES.map(stage => {
    const stageTasks = tasks.filter(task => journeyStageForTask(task) === stage.id);
    const stageCompleted = stageTasks.filter(task => label(task.status, 'pending').toLowerCase() === 'completed').length;
    const profileComplete = stage.id === 'personal_information' && Boolean(employeeDetail || row.employee);
    const employmentComplete = stage.id === 'employment_details' && row.role !== 'Role not set' && Boolean(row.startDate);
    const complete = profileComplete || employmentComplete || (stageTasks.length > 0 && stageCompleted === stageTasks.length);
    const inProgress = !complete && stageCompleted > 0;
    const completedAt = stageTasks
      .map(task => dateValue(value(task, 'completedAt', 'completed_at')))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    return {
      ...stage,
      tasks: stageTasks,
      complete,
      inProgress,
      helper: complete
        ? completedAt ? `Completed ${formatDate(completedAt)}` : 'Completed'
        : inProgress
          ? `${stageTasks.length - stageCompleted} task${stageTasks.length - stageCompleted === 1 ? '' : 's'} remaining`
          : stage.id === 'orientation' && courseCount
            ? `${courseCount} learning assignment${courseCount === 1 ? '' : 's'}`
            : 'Not started',
      value: complete ? 100 : stageTasks.length ? Math.round((stageCompleted / stageTasks.length) * 100) : 0,
    };
  });
  const selectedStage = stageProgress.find(stage => stage.id === activeStage) || null;
  const blockerTask = prioritized[0] || null;
  const blockerDueDate = onboardingTaskDueDate(row, blockerTask) || dateValue(value(row.caseItem, 'targetDate', 'target_date'));
  const blockerOverdueDays = blockerDueDate ? Math.max(0, Math.floor((Date.now() - blockerDueDate.getTime()) / 86_400_000)) : 0;
  const nextActionDue = blockerDueDate ? formatDate(blockerDueDate) : relativeStart(row.daysToStart);

  return (
    <Sheet open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <SheetContent
        side="right"
        hideCloseButton
        sheetId="onboarding-journey-details"
        className="!bottom-4 !left-auto !right-4 !top-4 !h-[calc(100dvh-2rem)] !w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl sm:!max-w-[420px]"
      >
        <SheetTitle className="sr-only">{row.name}</SheetTitle>
        <SheetDescription className="sr-only">Review onboarding readiness, blockers, tasks, and next actions for {row.name}.</SheetDescription>
        <aside aria-label="Journey details" className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-lg font-bold tracking-[-0.025em]">{row.name}</h2>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bd7] dark:hover:bg-zinc-800 dark:hover:text-white" aria-label="Close journey details"><XMarkIcon className="h-4 w-4" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {selectedStage ? (
          <JourneyStageDetails
            row={row}
            stage={selectedStage}
            canManage={canManage}
            onBack={() => setActiveStage(null)}
            onTaskUpdated={onTaskUpdated}
          />
        ) : (
          <>
        <div className="flex items-start gap-3">
          <EmployeeAvatar row={row} size="lg" />
          <div className="min-w-0"><h3 className="truncate text-base font-bold">{row.name}</h3><p className="mt-0.5 truncate text-sm text-slate-500">{row.role}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDaysIcon className="h-4 w-4" />Starts {row.startDateLabel} <span className="font-medium text-slate-600 dark:text-zinc-300">({relativeStart(row.daysToStart)})</span></p><p className="mt-1 text-xs text-slate-500">Manager: <span className="font-medium text-slate-700 dark:text-zinc-200">{manager}</span></p></div>
        </div>

        <div className="mt-5 border-y border-slate-200 py-4 dark:border-zinc-800">
          <div className="flex items-end justify-between"><div><p className="text-xs font-medium text-slate-500">Overall readiness</p><p className="mt-1 text-3xl font-bold tabular-nums">{progress}%</p></div><p className="text-right text-xs text-slate-500">{row.phase}<br />{completedTasks} of {tasks.length || 0} complete</p></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700"><div className="h-full rounded-full bg-[#155bd7]" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-zinc-800">
          <div className="py-4">
            <p className="text-xs font-medium text-slate-500">Top blocker</p>
            <div className="mt-2.5 flex items-start gap-2.5"><GroupIcon group={row.group} className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0"><p className="text-sm font-semibold">{row.topBlocker}</p><p className="mt-1 text-xs text-slate-500">{blockerDueDate ? <>Due {formatDate(blockerDueDate)}{blockerOverdueDays > 0 && <span className="text-rose-500"> · Overdue by {blockerOverdueDays} day{blockerOverdueDays === 1 ? '' : 's'}</span>}</> : row.group === 'needs_action' ? 'Needs attention now' : 'No urgent blocker recorded'}</p></div></div>
          </div>
          <Link href={`/people/${row.employeeId}?tab=Onboarding`} className="group flex items-center gap-2.5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bd7]">
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#155bd7]" />
            <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-500">Next action</span><span className="mt-1 block truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{row.nextAction}</span><span className="mt-1 block text-xs text-slate-500">Due {nextActionDue}</span></span>
            <ChevronRightIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <section className="border-t border-slate-200 py-4 dark:border-zinc-800">
          <h3 className="text-xs font-medium text-slate-500">Journey progress</h3>
          <div className="mt-3 space-y-3">
            {stageProgress.map((stage, index) => (
              <button type="button" key={stage.id} disabled={!stage.tasks.length} onClick={() => stage.tasks.length && setActiveStage(stage.id)} className="group flex w-full items-start gap-3 text-left disabled:cursor-default">
                {stage.complete ? (
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold', stage.inProgress ? 'border-[#155bd7] bg-[#155bd7] text-white' : 'border-slate-300 bg-slate-100 text-slate-500 dark:border-zinc-600 dark:bg-zinc-800')}>{index + 1}</span>
                )}
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900 dark:text-zinc-100">{stage.label}</span><span className="mt-1 block text-xs text-slate-500">{stage.helper}</span></span>
                {stage.tasks.length > 0 && <ChevronRightIcon className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600" />}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-slate-200 pt-4 dark:border-zinc-800">
          <Link href={`/people/${row.employeeId}?tab=Onboarding`} className="inline-flex items-center gap-2 text-sm font-medium text-[#155bd7] hover:text-[#104dbb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155bd7]">View full journey <ArrowTopRightOnSquareIcon className="h-4 w-4" /></Link>
        </div>
          </>
        )}
      </div>
        </aside>
      </SheetContent>
    </Sheet>
  );
}

function StatusOverview({ activeFilter, counts, onChange }: {
  activeFilter: JourneyFilter;
  counts: Record<string, number>;
  onChange: (filter: JourneyFilter) => void;
}) {
  return (
    <section aria-label="Onboarding status overview">
      <nav aria-label="Onboarding status" className="flex gap-6 overflow-x-auto border-b border-slate-200 dark:border-zinc-800">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              'relative flex h-11 shrink-0 items-center gap-1.5 text-xs font-semibold transition-colors',
              activeFilter === filter.id ? 'text-[#155bd7]' : 'text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white',
            )}
          >
            {filter.id !== 'all' && <GroupIcon group={filter.id} className="h-3.5 w-3.5" />}
            {filter.label} <span className="font-normal text-slate-400">({counts[filter.id] || 0})</span>
            {activeFilter === filter.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#155bd7]" />}
          </button>
        ))}
      </nav>
    </section>
  );
}

function JourneyStageDetails({ row, stage, canManage, onBack, onTaskUpdated }: {
  row: JourneyRow;
  stage: { id: JourneyStageId; label: string; helper: string; value: number; tasks: RecordItem[] };
  canManage: boolean;
  onBack: () => void;
  onTaskUpdated: (taskId: string, status: string, progress: number) => void;
}) {
  const [updatingTaskId, setUpdatingTaskId] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const completed = stage.tasks.filter(task => label(task.status, 'pending').toLowerCase() === 'completed').length;
  const incompleteTasks = stage.tasks.filter(task => label(task.status, 'pending').toLowerCase() !== 'completed');

  const persistTask = React.useCallback(async (task: RecordItem, isCompleted: boolean) => {
    const response = await fetch('/api/hr/onboarding/task-progress', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboardingId: row.caseItem.id,
        employeeId: row.employeeId,
        taskId: task.id,
        completed: isCompleted,
      }),
    });
    const payload = await response.json().catch(() => ({})) as { data?: { status?: string; progress?: number }; message?: string };
    if (!response.ok) throw new Error(payload.message || 'Unable to update onboarding task.');
    onTaskUpdated(task.id, payload.data?.status || (isCompleted ? 'completed' : 'pending'), Number(payload.data?.progress || 0));
  }, [onTaskUpdated, row.caseItem.id, row.employeeId]);

  async function toggleTask(task: RecordItem) {
    const isCompleted = label(task.status, 'pending').toLowerCase() === 'completed';
    setUpdatingTaskId(task.id);
    setUpdateError(null);
    try {
      await persistTask(task, !isCompleted);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Unable to update onboarding task.');
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function completeStage() {
    setUpdatingTaskId('stage');
    setUpdateError(null);
    try {
      for (const task of incompleteTasks) await persistTask(task, true);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Unable to complete this stage.');
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <section aria-label={`${stage.label} stage details`}>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#155bd7] hover:text-[#104dbb]">
        <ArrowLeftIcon className="h-4 w-4" />Journey overview
      </button>

      <div className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Journey stage</p><h3 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{stage.label}</h3></div>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', stage.value >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-[#155bd7] dark:bg-blue-950 dark:text-blue-300')}>{stage.value >= 100 ? 'Complete' : 'In progress'}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">Complete the assigned {stage.label.toLowerCase()} actions for {row.name}.</p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/35">
        <div className="flex items-end justify-between"><div><p className="text-xs font-medium text-slate-500">Stage readiness</p><p className="mt-1 text-3xl font-bold tabular-nums">{stage.value}%</p></div><p className="text-right text-xs text-slate-500">{completed} of {stage.tasks.length}<br />tasks completed</p></div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700"><div className="h-full origin-left rounded-full bg-[#155bd7] transition-transform" style={{ transform: `scaleX(${stage.value / 100})` }} /></div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div><h4 className="text-sm font-bold">Stage checklist</h4><p className="mt-0.5 text-xs text-slate-500">Updates are saved to the employee journey.</p></div>
        {canManage && <Button asChild size="sm" variant="outline"><Link href="/settings?adminTab=hr-setup&config=onboarding">Configure</Link></Button>}
      </div>

      {updateError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{updateError}</p>}

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
        {stage.tasks.map(task => {
          const isCompleted = label(task.status, 'pending').toLowerCase() === 'completed';
          const dueDay = Number(value(task, 'dueDay', 'due_day') || 0);
          const dueDate = row.startDate ? new Date(row.startDate.getTime() + dueDay * 86_400_000) : null;
          const overdue = Boolean(!isCompleted && dueDate && dueDate.getTime() < Date.now());
          return (
            <article key={task.id} className="flex gap-3 border-b border-slate-200 p-4 last:border-b-0 dark:border-zinc-800">
              <button
                type="button"
                disabled={!canManage || updatingTaskId !== null}
                onClick={() => void toggleTask(task)}
                aria-label={`${isCompleted ? 'Reopen' : 'Complete'} ${label(task.title, 'onboarding task')}`}
                className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50', isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-[#155bd7] dark:border-zinc-600')}
              >
                {isCompleted && <CheckCircleIcon className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><h5 className={cn('text-sm font-semibold', isCompleted && 'text-slate-400 line-through')}>{label(task.title, 'Checklist task')}</h5>{overdue && <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">Overdue</span>}</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{label(task.description, 'No additional instructions.')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500"><span className="capitalize">Owner: <strong className="font-semibold text-slate-700 dark:text-zinc-300">{label(value(task, 'ownerRole', 'owner_role'), 'Employee')}</strong></span><span>Due: <strong className={cn('font-semibold text-slate-700 dark:text-zinc-300', overdue && 'text-rose-600 dark:text-rose-400')}>{dueDate ? formatDate(dueDate) : `Day ${dueDay}`}</strong></span></div>
              </div>
            </article>
          );
        })}
      </div>

      {canManage && stage.tasks.length > 0 && (
        <div className="sticky bottom-0 -mx-6 mt-6 flex items-center gap-2 border-t border-slate-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>Back</Button>
          <Button type="button" className="flex-1 bg-[#155bd7] hover:bg-[#104dbb]" disabled={!incompleteTasks.length || updatingTaskId !== null} onClick={() => void completeStage()}>{updatingTaskId === 'stage' ? 'Saving…' : incompleteTasks.length ? 'Mark stage complete' : 'Stage complete'}</Button>
        </div>
      )}
    </section>
  );
}

function EmployeeAvatar({ row, size }: { row: JourneyRow; size: 'sm' | 'lg' }) {
  return <Avatar size={size === 'lg' ? 'lg' : 'sm'} className={cn('rounded-full border border-slate-200 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800', size === 'lg' && 'h-12 w-12')}><AvatarImage src={row.avatarUrl || undefined} alt="" /><AvatarFallback className="rounded-full bg-blue-50 text-xs font-bold text-[#155bd7] dark:bg-blue-950 dark:text-blue-300">{row.initials}</AvatarFallback></Avatar>;
}

function OnboardingSkeleton() {
  return <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" aria-label="Loading onboarding journeys"><div className="h-10 animate-pulse bg-slate-100 dark:bg-zinc-800" />{Array.from({ length: 7 }).map((_, index) => <div key={index} className="flex items-center gap-4 border-t border-slate-100 px-4 py-4 dark:border-zinc-800"><span className="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-zinc-700" /><span className="h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" /><span className="ml-auto h-2 w-28 animate-pulse rounded bg-slate-200 dark:bg-zinc-700" /></div>)}</div>;
}

function EmptyState({ canManage, onStart }: { canManage: boolean; onStart: () => void }) {
  return <div className="mt-6 grid min-h-[420px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-zinc-700 dark:bg-zinc-900"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-[#155bd7] dark:bg-blue-950"><UserGroupIcon className="h-6 w-6" /></span><h2 className="mt-4 text-lg font-bold">No onboarding journeys yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Start the first employee journey to track readiness, owners, tasks, assets, and learning in one place.</p>{canManage && <Button type="button" onClick={onStart} className="mt-5 bg-[#155bd7] hover:bg-[#104dbb]"><PlusIcon className="mr-2 h-4 w-4" />Start onboarding</Button>}</div></div>;
}

function StartOnboardingDialog({ open, onOpenChange, form, templates, setForm, isSaving, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { employeeId: string; templateId: string; startDate: string; targetDate: string };
  templates: RecordItem[];
  setForm: React.Dispatch<React.SetStateAction<{ employeeId: string; templateId: string; startDate: string; targetDate: string }>>;
  isSaving: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader><DialogTitle>Start employee onboarding</DialogTitle><DialogDescription>Create the journey now; profile, checklist, and learning progress will update from their source records.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2"><Label>Employee</Label><HrEmployeeSearchSelect value={form.employeeId} onValueChange={employeeId => setForm(current => ({ ...current, employeeId }))} disabled={isSaving} /></div>
          <div className="grid gap-2">
            <Label htmlFor="onboarding-template">Published checklist template</Label>
            <select id="onboarding-template" value={form.templateId} onChange={event => setForm(current => ({ ...current, templateId: event.target.value }))} disabled={isSaving || !templates.length} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">{templates.length ? 'Select template' : 'No published templates available'}</option>
              {templates.map(template => <option key={template.id} value={template.id}>{label(template.name, 'Untitled template')}</option>)}
            </select>
            {!templates.length && <p className="text-xs text-amber-600">Publish a checklist template in HR Setup before starting a journey.</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Start date</Label><Input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></div><div className="grid gap-2"><Label>Target date</Label><Input type="date" value={form.targetDate} onChange={event => setForm(current => ({ ...current, targetDate: event.target.value }))} /></div></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" disabled={!form.employeeId || !form.templateId || isSaving} onClick={onSubmit}>{isSaving ? 'Starting…' : 'Start onboarding'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
