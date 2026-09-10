"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  FunnelIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PlusIcon,
  PlayIcon,
  TrashIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/contexts/LocalizationContext';
import type { HrModuleData } from '@/lib/hr/hr-api-data';
import type { HrModuleConfig } from '@/lib/hr/hr-module-config';
import type { HrResourceField } from '@/lib/hr/hr-resource-registry';
import { getContractExpiry } from '@/lib/hr/contract-monitoring';
import { cn } from '@/lib/utils';
import { EmployeeCreateFromApplicantDialog } from './EmployeeCreateFromApplicantDialog';
import { HrEmployeeSearchSelect } from './HrEmployeeSearchSelect';
import { HrResourceSearchSelect } from './HrResourceSearchSelect';

interface HrModulePageProps {
  config: HrModuleConfig;
}

const emptyData: HrModuleData = {
  metrics: [],
  records: [],
  emptyTitle: 'No records yet',
  emptyDescription: 'Records will appear when this HR module has data.',
};

interface HrResourcePayload {
  fields: HrResourceField[];
  records: Array<Record<string, unknown> & { id: string }>;
}

const referenceFieldConfig: Record<string, { apiPath: string; labelKeys: string[]; label: string }> = {
  templateId: { apiPath: '/api/hr/onboarding?view=templates', labelKeys: ['name', 'title'], label: 'Template' },
  scheduleId: { apiPath: '/api/hr/attendance?view=schedules', labelKeys: ['name', 'code'], label: 'Schedule' },
  policyId: { apiPath: '/api/hr/leave?view=policies', labelKeys: ['name', 'leaveType'], label: 'Leave policy' },
  cycleId: { apiPath: '/api/hr/performance?view=cycles', labelKeys: ['name', 'title'], label: 'Performance cycle' },
  reviewId: { apiPath: '/api/hr/performance', labelKeys: ['title', 'status'], label: 'Performance review' },
  courseId: { apiPath: '/api/hr/learning?view=courses', labelKeys: ['title', 'name'], label: 'Course' },
  periodId: { apiPath: '/api/hr/payroll?view=periods', labelKeys: ['name', 'startDate', 'endDate'], label: 'Payroll period' },
  payrollRunId: { apiPath: '/api/hr/payroll-runs', labelKeys: ['name', 'status'], label: 'Payroll run' },
  payrollRunItemId: { apiPath: '/api/hr/payroll-runs?view=items', labelKeys: ['employeeId', 'status'], label: 'Payroll run item' },
  benefitPlanId: { apiPath: '/api/hr/benefits', labelKeys: ['name', 'provider'], label: 'Benefit plan' },
};

type HrModuleResponse = HrModuleData & {
  resource?: HrResourcePayload;
};

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

function buildInitialForm(fields: HrResourceField[], record?: Record<string, unknown>) {
  return Object.fromEntries(fields.map((field) => [
    field.name,
    record ? stringifyValue(record[field.name]) : field.options?.[0] || '',
  ]));
}

function buildResourceApiPath(apiPath: string, view?: string) {
  if (!view) return apiPath;
  const [pathname, search = ''] = apiPath.split('?');
  const params = new URLSearchParams(search);
  params.set('view', view);
  return `${pathname}?${params.toString()}`;
}

function csvCell(value: unknown) {
  const text = stringifyValue(value).replace(/"/g, '""');
  return `"${text}"`;
}

function exportEmployeeCsv(employees: Array<Record<string, unknown>>) {
  const columns = [
    ['employeeNumber', 'Employee No.'],
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['email', 'Email'],
    ['accountName', 'Account name'],
    ['accountEmail', 'Account email'],
    ['accountRole', 'Account role'],
    ['accountIsActive', 'Account active'],
    ['phone', 'Phone'],
    ['jobTitle', 'Job title'],
    ['employmentType', 'Employment type'],
    ['clientName', 'Client'],
    ['status', 'Status'],
    ['onboardingStatus', 'Onboarding'],
    ['location', 'Location'],
    ['hireDate', 'Hire date'],
  ] as const;
  const rows = [
    columns.map(([, label]) => csvCell(label)).join(','),
    ...employees.map(employee => columns.map(([key]) => csvCell(employee[key])).join(',')),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `employee-directory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getWorkflowActions(moduleKey: HrModuleConfig['key'], status: string) {
  const normalizedStatus = status.toLowerCase();
  if (moduleKey === 'leave' && normalizedStatus === 'pending') {
    return [
      { action: 'approve_leave', label: 'Approve', tone: 'positive' as const },
      { action: 'reject_leave', label: 'Reject', tone: 'danger' as const },
    ];
  }
  if (moduleKey === 'onboarding') {
    if (normalizedStatus === 'not_started') return [{ action: 'start_onboarding', label: 'Start', tone: 'primary' as const }];
    if (normalizedStatus === 'in_progress') return [{ action: 'complete_onboarding', label: 'Complete', tone: 'positive' as const }];
  }
  if (moduleKey === 'attendance') {
    if (normalizedStatus === 'late') return [{ action: 'mark_present', label: 'Mark present', tone: 'positive' as const }];
    if (normalizedStatus === 'present') return [{ action: 'mark_late', label: 'Mark late', tone: 'primary' as const }];
  }
  if (moduleKey === 'learning' && ['assigned', 'in_progress'].includes(normalizedStatus)) {
    return [{ action: 'complete_learning', label: 'Complete', tone: 'positive' as const }];
  }
  if (moduleKey === 'performance' && ['not_started', 'in_progress'].includes(normalizedStatus)) {
    return [{ action: 'complete_review', label: 'Complete review', tone: 'positive' as const }];
  }
  if (moduleKey === 'payroll-runs' && normalizedStatus === 'draft') {
    return [{ action: 'process_payroll', label: 'Process run', tone: 'primary' as const }];
  }
  if (moduleKey === 'payslips' && normalizedStatus === 'draft') {
    return [{ action: 'publish_payslip', label: 'Publish', tone: 'primary' as const }];
  }
  return [];
}

function getWorkflowSteps(moduleKey: HrModuleConfig['key']) {
  if (moduleKey === 'onboarding') return ['Create case', 'Start checklist', 'Complete employee setup'];
  if (moduleKey === 'leave') return ['Employee request', 'Manager/HR decision', 'Balance and calendar update'];
  if (moduleKey === 'attendance') return ['Capture time', 'Review exceptions', 'Approve payroll-ready hours'];
  if (moduleKey === 'learning') return ['Assign course', 'Track progress', 'Certify completion'];
  if (moduleKey === 'performance') return ['Open cycle', 'Collect review', 'Close acknowledgement'];
  if (moduleKey === 'payroll' || moduleKey === 'payroll-runs') return ['Prepare period', 'Process run', 'Publish outputs'];
  if (moduleKey === 'payslips') return ['Generate draft', 'Review', 'Publish to ESS'];
  if (moduleKey === 'people') return ['Create employee', 'Link user', 'Activate employee services'];
  if (moduleKey === 'documents') return ['Configure document', 'Collect acknowledgment', 'Track receipt and expiry'];
  if (moduleKey === 'benefits') return ['Create plan', 'Enroll employee', 'Track cost'];
  return ['Plan', 'Review', 'Complete'];
}

const employeePageSize = 10;

function employeeText(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value).replace(/_/g, ' ');
}

function employeeName(record: Record<string, unknown>) {
  return [record.firstName, record.lastName].filter(Boolean).map(String).join(' ') || 'Unnamed employee';
}

function employeeInitials(record: Record<string, unknown>) {
  const initials = [record.firstName, record.lastName]
    .filter(Boolean)
    .map(value => String(value).trim().charAt(0))
    .join('')
    .toUpperCase();
  return initials || '—';
}

function employeeAccountLabel(record: Record<string, unknown>) {
  if (!record.accountUserId) return 'No account';
  return stringifyValue(record.accountName) || stringifyValue(record.accountEmail) || 'Linked account';
}

function employeeAccountHelper(record: Record<string, unknown>) {
  if (!record.accountUserId) return 'No matching user';
  const status = record.accountIsActive === false
    ? 'disabled'
    : record.accountForcePasswordChange === true
      ? 'invited'
      : 'active';
  return `${record.accountLinkedByEmail ? 'Matched by email' : 'Linked by user ID'} - ${status}`;
}

function employeeStatusBadgeVariant(status: unknown) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return 'default' as const;
  if (['inactive', 'terminated'].includes(normalized)) return 'destructive' as const;
  return 'outline' as const;
}

function EmployeeDirectoryTable({
  resource,
  query,
  setQuery,
  isLoading,
  error,
  setDeleteRecord,
  onEmployeeCreated,
}: {
  resource: HrResourcePayload;
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  error: string | null;
  setDeleteRecord: React.Dispatch<React.SetStateAction<Record<string, unknown> & { id: string } | null>>;
  onEmployeeCreated: () => Promise<void> | void;
}) {
  const { locale } = useLocalization();
  const isThaiLocale = locale.toLowerCase().startsWith('th');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [employmentFilter, setEmploymentFilter] = React.useState('all');
  const [locationFilter, setLocationFilter] = React.useState('all');
  const [accountFilter, setAccountFilter] = React.useState('all');
  const [contractFilter, setContractFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importMode, setImportMode] = React.useState<'excel' | 'azure'>('excel');
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importMessage, setImportMessage] = React.useState<string | null>(null);
  const [createEmployeeOpen, setCreateEmployeeOpen] = React.useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = React.useState('active');
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [isSendingContractAlerts, setIsSendingContractAlerts] = React.useState(false);
  const [contractAlertMessage, setContractAlertMessage] = React.useState<string | null>(null);

  const filterOptions = React.useMemo(() => {
    const statuses = Array.from(new Set(resource.records.map(record => String(record.status || '')).filter(Boolean))).sort();
    const employmentTypes = Array.from(new Set(resource.records.map(record => String(record.employmentType || '')).filter(Boolean))).sort();
    const locations = Array.from(new Set(resource.records.map(record => String(record.location || '')).filter(Boolean))).sort();
    return { statuses, employmentTypes, locations };
  }, [resource.records]);

  const filteredEmployees = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resource.records.filter((record) => {
      const matchesQuery = !normalizedQuery || [
        record.employeeNumber,
        employeeName(record),
        record.email,
        record.accountName,
        record.accountEmail,
        record.accountRole,
        record.phone,
        record.jobTitle,
        record.employmentType,
        record.clientName,
        record.clientCode,
        record.status,
        record.onboardingStatus,
        record.location,
      ].join(' ').toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesEmployment = employmentFilter === 'all' || record.employmentType === employmentFilter;
      const matchesLocation = locationFilter === 'all' || record.location === locationFilter;
      const accountState = !record.accountUserId ? 'missing' : record.accountIsActive === false ? 'disabled' : 'active';
      const matchesAccount = accountFilter === 'all' || accountState === accountFilter;
      const contractState = getContractExpiry(record).state;
      const matchesContract = contractFilter === 'all'
        || (contractFilter === 'attention' && ['due', 'expired', 'missing_end_date'].includes(contractState))
        || contractState === contractFilter;
      return matchesQuery && matchesStatus && matchesEmployment && matchesLocation && matchesAccount && matchesContract;
    });
  }, [accountFilter, contractFilter, employmentFilter, locationFilter, query, resource.records, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [accountFilter, contractFilter, employmentFilter, locationFilter, query, statusFilter]);

  const contractSummary = React.useMemo(() => resource.records.reduce((summary, employee) => {
    const state = getContractExpiry(employee).state;
    if (state === 'due') summary.due += 1;
    if (state === 'expired') summary.expired += 1;
    if (state === 'missing_end_date') summary.missing += 1;
    return summary;
  }, { due: 0, expired: 0, missing: 0 }), [resource.records]);

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const safePage = Math.min(page, pageCount);
  const visibleEmployees = filteredEmployees.slice((safePage - 1) * employeePageSize, safePage * employeePageSize);
  const start = filteredEmployees.length === 0 ? 0 : (safePage - 1) * employeePageSize + 1;
  const end = Math.min(filteredEmployees.length, safePage * employeePageSize);
  const activeFilters = [statusFilter, employmentFilter, locationFilter, accountFilter, contractFilter].filter(value => value !== 'all').length;
  const visibleEmployeeIds = visibleEmployees.map(employee => employee.id);
  const allVisibleSelected = visibleEmployeeIds.length > 0 && visibleEmployeeIds.every(id => selectedEmployeeIds.has(id));
  const selectedEmployees = resource.records.filter(employee => selectedEmployeeIds.has(employee.id));
  const selectedEmployee = selectedEmployees.length === 1 ? selectedEmployees[0] : null;
  const activeFilterItems = [
    statusFilter !== 'all' ? { key: 'status', label: `Status: ${employeeText(statusFilter)}`, clear: () => setStatusFilter('all') } : null,
    employmentFilter !== 'all' ? { key: 'employment', label: `Type: ${employeeText(employmentFilter)}`, clear: () => setEmploymentFilter('all') } : null,
    locationFilter !== 'all' ? { key: 'location', label: `Location: ${locationFilter}`, clear: () => setLocationFilter('all') } : null,
    accountFilter !== 'all' ? { key: 'account', label: `Account: ${employeeText(accountFilter)}`, clear: () => setAccountFilter('all') } : null,
    contractFilter !== 'all' ? { key: 'contract', label: `Contract: ${employeeText(contractFilter)}`, clear: () => setContractFilter('all') } : null,
  ].filter((item): item is { key: string; label: string; clear: () => void } => Boolean(item));

  function toggleVisibleEmployees(checked: boolean) {
    setSelectedEmployeeIds(current => {
      const next = new Set(current);
      visibleEmployeeIds.forEach(id => checked ? next.add(id) : next.delete(id));
      return next;
    });
  }

  async function updateSelectedEmployeeStatus(nextStatus = bulkStatus) {
    const ids = Array.from(selectedEmployeeIds);
    if (ids.length === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    setBulkError(null);

    try {
      const results = await Promise.allSettled(ids.map(async id => {
        const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!response.ok) throw new Error(`Failed to update employee ${id}`);
      }));
      const failures = results.filter(result => result.status === 'rejected').length;
      if (failures > 0) {
        setBulkError(`${ids.length - failures} updated; ${failures} failed. Failed rows remain selected.`);
        setSelectedEmployeeIds(new Set(ids.filter((_, index) => results[index].status === 'rejected')));
      } else {
        setSelectedEmployeeIds(new Set());
      }
      await onEmployeeCreated();
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function sendContractAlerts() {
    setIsSendingContractAlerts(true);
    setContractAlertMessage(null);
    try {
      const response = await fetch('/api/hr/contract-alerts', { method: 'POST', credentials: 'include' });
      const payload = await response.json() as { created?: number; skipped?: number; message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to create contract alerts.');
      setContractAlertMessage(`${payload.created || 0} alert(s) created${payload.skipped ? `; ${payload.skipped} already sent today` : ''}.`);
    } catch (alertError) {
      setContractAlertMessage(alertError instanceof Error ? alertError.message : 'Unable to create contract alerts.');
    } finally {
      setIsSendingContractAlerts(false);
    }
  }

  async function createSelectedEmployeeAccounts() {
    const employees = selectedEmployees.filter(employee => !employee.accountUserId);
    if (employees.length === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    setBulkError(null);
    try {
      const results = await Promise.allSettled(employees.map(async employee => {
        const response = await fetch(`/api/hr/employees/${encodeURIComponent(employee.id)}/system-account`, {
          method: 'POST',
          credentials: 'include',
        });
        const payload = await response.json().catch(() => ({})) as { message?: string };
        if (!response.ok) throw new Error(payload.message || `Unable to create an account for ${employeeName(employee)}.`);
      }));
      const failures = results.filter(result => result.status === 'rejected').length;
      setBulkError(failures
        ? `${employees.length - failures} account${employees.length - failures === 1 ? '' : 's'} created; ${failures} failed. Open the affected employee profiles for details.`
        : `${employees.length} employee account${employees.length === 1 ? '' : 's'} created and invitations queued.`);
      await onEmployeeCreated();
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function runEmployeeImport() {
    if (isImporting) return;
    if (importMode === 'excel' && !importFile) return;
    setIsImporting(true);
    setImportMessage(null);
    try {
      const response = importMode === 'excel'
        ? await (() => {
            const body = new FormData();
            body.set('file', importFile as File);
            return fetch('/api/hr/employees/import', { method: 'POST', credentials: 'include', body });
          })()
        : await fetch('/api/v1/users/sync-ad', { method: 'POST', credentials: 'include' });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || (importMode === 'excel' ? 'Unable to import employees.' : 'Unable to sync Azure AD users.'));
      setImportMessage(payload.message || (importMode === 'excel' ? 'Employee import completed.' : 'Azure AD user sync completed.'));
      await onEmployeeCreated();
      if (importMode === 'excel') setImportFile(null);
    } catch (importError) {
      setImportMessage(importError instanceof Error ? importError.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="flex min-h-full w-full flex-col bg-background text-foreground">
      <div className="flex min-h-full w-full flex-1">
        <section className="flex min-h-full w-full flex-1 flex-col bg-background">
          <div className="px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.04em] text-primary">People <span className="px-1.5 text-muted-foreground/60">›</span> Employee records</p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-foreground">Employee directory</h1>
              <p role="status" aria-live="polite" className="mt-1.5 text-sm leading-5 text-muted-foreground">
                {isLoading
                  ? (isThaiLocale ? 'กำลังโหลดพนักงาน…' : 'Loading employees…')
                  : isThaiLocale ? `${filteredEmployees.length} พนักงาน` : `${filteredEmployees.length} employee${filteredEmployees.length === 1 ? '' : 's'}`}
                <span aria-hidden="true" className="mx-1 text-border">|</span>
                {isThaiLocale ? 'ข้อมูล ณ ปัจจุบัน' : 'Data as of today'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:justify-end">
              <label className="relative block w-full sm:min-w-80 lg:w-[400px] lg:shrink-0">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-muted/35 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Search employees"
                />
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 justify-start gap-2 px-4">
                    <FunnelIcon className="h-4 w-4" />
                    Filter
                    {activeFilters > 0 && <Badge variant="secondary" className="ml-1 rounded-full">{activeFilters}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 rounded-[8px]">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Filters</h2>
                      <p className="text-xs text-muted-foreground">Narrow the employee table.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-status-filter">Status</Label>
                      <select id="employee-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm capitalize text-foreground">
                        <option value="all">All statuses</option>
                        {filterOptions.statuses.map(status => <option key={status} value={status}>{employeeText(status)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-type-filter">Employment type</Label>
                      <select id="employee-type-filter" value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)} className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm capitalize text-foreground">
                        <option value="all">All types</option>
                        {filterOptions.employmentTypes.map(type => <option key={type} value={type}>{employeeText(type)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-location-filter">Location</Label>
                      <select id="employee-location-filter" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground">
                        <option value="all">All locations</option>
                        {filterOptions.locations.map(location => <option key={location} value={location}>{location}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-account-filter">Platform account</Label>
                      <select id="employee-account-filter" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground">
                        <option value="all">All account states</option>
                        <option value="missing">No account</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-contract-filter">Contract end</Label>
                      <select id="employee-contract-filter" value={contractFilter} onChange={(event) => setContractFilter(event.target.value)} className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground">
                        <option value="all">All</option>
                        <option value="attention">Needs attention</option>
                        <option value="due">Within notice period</option>
                        <option value="expired">Expired</option>
                        <option value="missing_end_date">Missing end date</option>
                      </select>
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={() => {
                      setStatusFilter('all');
                      setEmploymentFilter('all');
                      setLocationFilter('all');
                      setAccountFilter('all');
                      setContractFilter('all');
                    }}>
                      Reset filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                className="h-11 justify-start gap-2 px-4"
                onClick={() => setCreateEmployeeOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                New Employee
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 justify-start gap-2 px-4">
                    <CloudArrowUpIcon className="h-4 w-4" />
                    Import / Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-[8px]">
                  <DropdownMenuItem onClick={() => {
                    setImportMode('excel');
                    setImportDialogOpen(true);
                  }}>
                    <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
                    Import
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportEmployeeCsv(filteredEmployees)}>
                    <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {activeFilterItems.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Active employee filters">
            {activeFilterItems.map(item => <button key={item.key} type="button" onClick={item.clear} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/45 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"><span>{item.label}</span><XCircleIcon className="h-4 w-4 text-muted-foreground" /></button>)}
            <button type="button" onClick={() => { setStatusFilter('all'); setEmploymentFilter('all'); setLocationFilter('all'); setAccountFilter('all'); setContractFilter('all'); }} className="h-8 px-2 text-xs font-semibold text-primary hover:underline">Clear all</button>
          </div>}

          <div className="mt-7 flex flex-col border-y border-border/80 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid min-w-0 flex-1 sm:grid-cols-3 lg:grid-cols-[minmax(280px,1.15fr)_minmax(240px,0.9fr)_minmax(260px,1fr)] xl:grid-cols-[370px_270px_minmax(260px,1fr)]">
            {[
              { label: 'Contracts in notice period', value: contractSummary.due, filter: 'due', tone: 'text-rose-600 dark:text-rose-300', dot: 'bg-rose-400' },
              { label: 'Contracts expired', value: contractSummary.expired, filter: 'expired', tone: 'text-amber-600 dark:text-amber-300', dot: 'bg-amber-400' },
              { label: 'Missing end date', value: contractSummary.missing, filter: 'missing_end_date', tone: 'text-emerald-600 dark:text-emerald-300', dot: 'bg-emerald-400' },
            ].map(item => (
              <button key={item.filter} type="button" aria-pressed={contractFilter === item.filter} onClick={() => setContractFilter(current => current === item.filter ? 'all' : item.filter)} className={cn('group flex min-h-20 min-w-0 items-center gap-3 border-b border-border/70 px-3 text-left transition-colors hover:bg-muted/25 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0 lg:px-5', contractFilter === item.filter && 'bg-primary/5')}>
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.dot)} aria-hidden="true" />
                <span className="min-w-0 truncate text-sm font-medium text-muted-foreground group-hover:text-foreground">{item.label}</span>
                <span className={cn('ml-auto shrink-0 text-xl font-semibold tracking-[-0.04em] tabular-nums', item.tone)}>{item.value}</span>
              </button>
            ))}
            </div>
            <button type="button" aria-pressed={contractFilter === 'attention'} onClick={() => setContractFilter(current => current === 'attention' ? 'all' : 'attention')} className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-2 px-4 text-sm font-semibold text-[#1769e0] transition-colors hover:bg-blue-500/5 hover:text-[#0f56bf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:text-[#60a5fa] dark:hover:text-[#93c5fd] lg:min-h-20 lg:px-5">
              {isThaiLocale ? 'ดูภาพรวมสัญญา' : 'View contract overview'}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border bg-muted/25 px-5 py-2">
            <p className="text-xs text-muted-foreground">Contract alerts use each employee&apos;s notice period and are de-duplicated daily.</p>
            <div className="flex items-center gap-3">
              <span role="status" aria-live="polite" className="text-xs text-muted-foreground">{contractAlertMessage}</span>
              <Button type="button" size="sm" variant="outline" disabled={isSendingContractAlerts} onClick={() => void sendContractAlerts()}>
                {isSendingContractAlerts ? 'Creating alerts…' : 'Create contract alerts'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/80 px-2 text-sm text-muted-foreground">
              <InformationCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
              <button type="button" disabled={isLoading} onClick={() => void onEmployeeCreated()} className="font-semibold text-[#1769e0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 dark:text-[#60a5fa]">
                {isLoading ? 'Retrying…' : 'Retry'}
              </button>
            </div>
          )}
          </div>
          {selectedEmployeeIds.size > 0 && (
            <div className="flex min-h-14 flex-wrap items-center gap-2 border-y border-primary/20 bg-primary/5 px-5 py-2">
              <span className="min-w-40 border-r border-border pr-5 text-sm font-semibold text-foreground">{selectedEmployeeIds.size} employee{selectedEmployeeIds.size === 1 ? '' : 's'} selected</span>
              {selectedEmployee && <>
                <Button asChild type="button" variant="ghost" size="sm" className="gap-2"><Link href={`/people/${selectedEmployee.id}`}><EyeIcon className="h-4 w-4" />View profile</Link></Button>
                <Button asChild type="button" variant="ghost" size="sm" className="gap-2"><Link href={`/people/${selectedEmployee.id}`}><PencilSquareIcon className="h-4 w-4" />Edit</Link></Button>
              </>}
              <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={isBulkUpdating} onClick={() => void updateSelectedEmployeeStatus('inactive')}><NoSymbolIcon className="h-4 w-4" />Deactivate</Button>
              {selectedEmployees.some(employee => !employee.accountUserId) ? (
                <Button type="button" variant="ghost" size="sm" className="gap-2" disabled={isBulkUpdating} onClick={() => void createSelectedEmployeeAccounts()}>
                  <UserPlusIcon className="h-4 w-4" />Create accounts
                </Button>
              ) : null}
              <span aria-hidden="true" className="mx-1 h-7 w-px bg-border" />
              <Label htmlFor="employee-bulk-status" className="text-xs text-muted-foreground">Set status</Label>
              <select id="employee-bulk-status" value={bulkStatus} onChange={event => setBulkStatus(event.target.value)} disabled={isBulkUpdating} className="h-8 rounded-md border border-input bg-background px-2 text-sm capitalize">
                {['active', 'inactive', 'onboarding', 'probation'].map(status => <option key={status} value={status}>{employeeText(status)}</option>)}
              </select>
              <Button type="button" size="sm" variant="outline" disabled={isBulkUpdating} onClick={() => void updateSelectedEmployeeStatus()}>
                {isBulkUpdating ? 'Updating...' : 'Apply'}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={isBulkUpdating} onClick={() => setSelectedEmployeeIds(new Set())} className="ml-auto">Clear</Button>
            </div>
          )}
          {bulkError && <div role="status" aria-live="polite" className="border-b border-primary/20 bg-primary/5 px-5 py-2 text-sm text-foreground">{bulkError}</div>}

          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full table-fixed text-left text-sm">
              <caption className="sr-only">Employee directory with account, employment, onboarding, location, and contract status.</caption>
              <thead className="sticky top-0 z-10 border-b border-border bg-muted text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      aria-label="Select all employees on this page"
                      checked={allVisibleSelected ? true : selectedEmployeeIds.size > 0 && visibleEmployeeIds.some(id => selectedEmployeeIds.has(id)) ? 'indeterminate' : false}
                      onCheckedChange={checked => toggleVisibleEmployees(checked === true)}
                    />
                  </th>
                  <th className="w-36 px-4 py-3">Employee No.</th>
                  <th className="w-80 px-4 py-3">Employee</th>
                  <th className="w-56 px-4 py-3">Account</th>
                  <th className="w-44 px-4 py-3">Phone</th>
                  <th className="w-52 px-4 py-3">Job title</th>
                  <th className="w-40 px-4 py-3">Type</th>
                  <th className="w-52 px-4 py-3">Client</th>
                  <th className="w-36 px-4 py-3">Status</th>
                  <th className="w-40 px-4 py-3">Onboarding</th>
                  <th className="w-40 px-4 py-3">Location</th>
                  <th className="w-36 px-4 py-3">Hire date</th>
                  <th className="w-52 px-4 py-3">Contract end</th>
                  <th className="w-24 px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 14 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4">
                          <div className="h-3 w-full animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : visibleEmployees.length > 0 ? (
                  visibleEmployees.map((employee) => (
                    <tr key={employee.id} className={cn('transition-colors hover:bg-muted/20', selectedEmployeeIds.has(employee.id) && 'bg-primary/10 hover:bg-primary/10')}>
                      <td className="px-4 py-3">
                        <Checkbox
                          aria-label={`Select ${employeeName(employee)}`}
                          checked={selectedEmployeeIds.has(employee.id)}
                          onCheckedChange={checked => setSelectedEmployeeIds(current => {
                            const next = new Set(current);
                            checked === true ? next.add(employee.id) : next.delete(employee.id);
                            return next;
                          })}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{employeeText(employee.employeeNumber)}</td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-full ring-1 ring-border">
                            <AvatarImage
                              src={stringifyValue(employee.employeeAvatarUrl) || undefined}
                              alt=""
                              className="rounded-full"
                            />
                            <AvatarFallback className="rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {employeeInitials(employee)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/people/${employee.id}`}
                              className="block truncate font-bold text-foreground hover:text-primary"
                            >
                              {employeeName(employee)}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{employeeText(employee.email)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{employeeAccountLabel(employee)}</p>
                          <p className="truncate text-xs text-muted-foreground">{employeeAccountHelper(employee)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{employeeText(employee.phone)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{employeeText(employee.jobTitle)}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{employeeText(employee.employmentType)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {employee.employmentType === 'subcontract'
                          ? employeeText(employee.clientName || employee.clientCode)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={employeeStatusBadgeVariant(employee.status)} className="rounded-full capitalize">
                          {employeeText(employee.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="rounded-full capitalize">{employeeText(employee.onboardingStatus)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{employeeText(employee.location)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{employeeText(employee.hireDate)}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const expiry = getContractExpiry(employee);
                          if (expiry.state === 'not_applicable') return <span className="text-muted-foreground">Not applicable</span>;
                          if (expiry.state === 'missing_end_date') return <Badge variant="destructive">End date required</Badge>;
                          const label = expiry.state === 'expired' ? `Expired ${Math.abs(expiry.daysRemaining || 0)}d ago` : `${expiry.daysRemaining}d left · alert at ${expiry.noticeDays}d`;
                          return <div><p className={cn('font-semibold', expiry.state === 'expired' ? 'text-red-700 dark:text-red-300' : expiry.state === 'due' ? 'text-amber-700 dark:text-amber-300' : 'text-foreground')}>{label}</p><p className="text-xs text-muted-foreground">{employeeText(employee.endDate)}</p></div>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9">
                            <Link href={`/people/${employee.id}`} aria-label={`Edit ${employeeName(employee)}`}>
                              <PencilSquareIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-destructive sm:h-9 sm:w-9" aria-label={`Archive ${employeeName(employee)}`} onClick={() => setDeleteRecord(employee)}>
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-14">
                      <div className="text-center">
                        <h3 className="text-sm font-bold text-foreground">No employees found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Adjust search or filters to find employee records.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {start}-{end} of {filteredEmployees.length}</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>
                <ChevronLeftIcon className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="min-w-20 text-center font-semibold text-foreground">Page {safePage} / {pageCount}</span>
              <Button type="button" variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>
                Next
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) { setImportFile(null); setImportMessage(null); }
      }}>
        <DialogContent className="max-w-2xl rounded-[8px]">
          <DialogHeader>
            <DialogTitle>Import employees</DialogTitle>
            <DialogDescription>Choose how employee records should be brought into the directory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={cn(
                'rounded-[8px] border p-4 text-left transition',
                importMode === 'excel' ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50',
              )}
              onClick={() => setImportMode('excel')}
            >
              <DocumentArrowUpIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-3 text-sm font-bold text-foreground">Import from Excel</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload an employee spreadsheet with employee number, name, email, job, status, and hire date columns.</p>
            </button>
            <button
              type="button"
              className={cn(
                'rounded-[8px] border p-4 text-left transition',
                importMode === 'azure' ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50',
              )}
              onClick={() => setImportMode('azure')}
            >
              <CloudArrowUpIcon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-3 text-sm font-bold text-foreground">Import via Azure AD</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Run the configured Azure AD account sync. Existing employee records are linked automatically when their work email matches.</p>
            </button>
          </div>
          {importMode === 'excel' ? (
            <div className="rounded-[8px] border border-border bg-muted/35 p-4">
              <Label htmlFor="employee-excel-import">Excel file</Label>
              <Input id="employee-excel-import" type="file" accept=".xlsx,.csv" className="mt-2" onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
              <p className="mt-2 text-xs text-muted-foreground">{importFile ? importFile.name : 'Accepted formats: .xlsx, .csv · maximum 1,000 rows'}</p>
            </div>
          ) : (
            <div className="rounded-[8px] border border-border bg-muted/35 p-4">
              <h3 className="text-sm font-bold text-foreground">Azure AD sync</h3>
              <p className="mt-1 text-sm text-muted-foreground">This calls the existing secured Azure AD synchronization service. It creates or updates platform users and links matching employee records by email.</p>
            </div>
          )}
          {importMessage && <p role="status" className="rounded-[8px] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{importMessage}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} disabled={isImporting}>Close</Button>
            <Button type="button" disabled={isImporting || (importMode === 'excel' && !importFile)} onClick={() => void runEmployeeImport()}>
              {isImporting ? 'Working...' : importMode === 'excel' ? 'Import employees' : 'Start Azure AD sync'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EmployeeCreateFromApplicantDialog
        open={createEmployeeOpen}
        onOpenChange={setCreateEmployeeOpen}
        onCreated={onEmployeeCreated}
      />
    </main>
  );
}

export function HrModulePage({ config }: HrModulePageProps) {
  const [activeView, setActiveView] = React.useState<string | undefined>(config.resourceViews?.[0]?.view);
  const [data, setData] = React.useState<HrModuleData>(emptyData);
  const [resource, setResource] = React.useState<HrResourcePayload>({ fields: [], records: [] });
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit' | null>(null);
  const [deleteRecord, setDeleteRecord] = React.useState<Record<string, unknown> & { id: string } | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<Record<string, unknown> & { id: string } | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, string>>({});
  const [fileValue, setFileValue] = React.useState<File | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string | null>(null);
  const activeApiPath = React.useMemo(
    () => buildResourceApiPath(config.apiPath, activeView),
    [activeView, config.apiPath],
  );

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(activeApiPath, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'You do not have permission to view this HR module.' : 'Unable to load HR module data.');
      }
      const payload = await response.json() as HrModuleResponse;
      setData(payload);
      setResource(payload.resource || { fields: [], records: [] });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load HR module data.');
      setData(emptyData);
      setResource({ fields: [], records: [] });
    } finally {
      setIsLoading(false);
    }
  }, [activeApiPath]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    setActiveView(config.resourceViews?.[0]?.view);
    setQuery('');
  }, [config.key, config.resourceViews]);

  const filteredRecords = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.records;
    return data.records.filter((record) => (
      `${record.title} ${record.subtitle} ${record.status} ${record.meta}`.toLowerCase().includes(normalizedQuery)
    ));
  }, [data.records, query]);

  const openCreateDialog = React.useCallback(() => {
    setEditingRecord(null);
    setFormValues(buildInitialForm(resource.fields));
    setFileValue(null);
    setFormError(null);
    setDialogMode('create');
  }, [resource.fields]);

  const openEditDialog = React.useCallback((recordId: string) => {
    const record = resource.records.find(item => item.id === recordId);
    if (!record) return;
    setEditingRecord(record);
    setFormValues(buildInitialForm(resource.fields, record));
    setFileValue(null);
    setFormError(null);
    setDialogMode('edit');
  }, [resource.fields, resource.records]);

  const closeFormDialog = React.useCallback(() => {
    setDialogMode(null);
    setEditingRecord(null);
    setFormError(null);
    setFileValue(null);
  }, []);

  const submitForm = React.useCallback(async () => {
    setIsSaving(true);
    setFormError(null);
    try {
      const hasFileField = resource.fields.some(field => field.type === 'file');
      const url = dialogMode === 'edit' && editingRecord
        ? `${activeApiPath}${activeApiPath.includes('?') ? '&' : '?'}id=${encodeURIComponent(editingRecord.id)}`
        : activeApiPath;
      const method = dialogMode === 'edit' ? 'PATCH' : 'POST';
      const body = hasFileField
        ? (() => {
            const formData = new FormData();
            for (const field of resource.fields) {
              if (field.type !== 'file') formData.set(field.name, formValues[field.name] || '');
            }
            if (fileValue) formData.set('file', fileValue);
            return formData;
          })()
        : JSON.stringify(formValues);
      const response = await fetch(url, {
        method,
        credentials: 'include',
        body,
        headers: hasFileField ? undefined : { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || 'Unable to save HR record.');
      }
      closeFormDialog();
      await loadData();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Unable to save HR record.');
    } finally {
      setIsSaving(false);
    }
  }, [activeApiPath, closeFormDialog, dialogMode, editingRecord, fileValue, formValues, loadData, resource.fields]);

  const confirmDelete = React.useCallback(async () => {
    if (!deleteRecord) return;
    setIsSaving(true);
    setFormError(null);
    try {
      const url = `${activeApiPath}${activeApiPath.includes('?') ? '&' : '?'}id=${encodeURIComponent(deleteRecord.id)}`;
      const response = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || 'Unable to archive HR record.');
      }
      setDeleteRecord(null);
      await loadData();
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Unable to archive HR record.');
    } finally {
      setIsSaving(false);
    }
  }, [activeApiPath, deleteRecord, loadData]);

  const runWorkflowAction = React.useCallback(async (recordId: string, action: string) => {
    setActiveWorkflowId(`${recordId}:${action}`);
    setFormError(null);
    try {
      const response = await fetch('/api/hr/workflows', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, action }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message || 'Unable to run HR workflow action.');
      }
      await loadData();
    } catch (workflowError) {
      setFormError(workflowError instanceof Error ? workflowError.message : 'Unable to run HR workflow action.');
    } finally {
      setActiveWorkflowId(null);
    }
  }, [loadData]);

  const resourceDialogs = (
    <>
      <Dialog open={dialogMode !== null} onOpenChange={(open) => {
        if (!open) closeFormDialog();
      }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-[8px]">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'edit' ? 'Edit record' : 'New record'}</DialogTitle>
            <DialogDescription>{config.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {resource.fields.map((field) => (
              <div key={field.name} className={cn('space-y-2', field.type === 'textarea' && 'sm:col-span-2', field.type === 'file' && 'sm:col-span-2')}>
                <Label htmlFor={`${config.key}-${field.name}`}>
                  {field.name === 'employeeId' || field.name === 'reviewerId' ? 'Employee' : referenceFieldConfig[field.name]?.label || field.label}
                  {field.required && <span className="text-red-600"> *</span>}
                </Label>
                {field.name === 'employeeId' || field.name === 'reviewerId' ? (
                  <HrEmployeeSearchSelect
                    id={`${config.key}-${field.name}`}
                    value={formValues[field.name] || ''}
                    onValueChange={(employeeId) => setFormValues(current => ({ ...current, [field.name]: employeeId }))}
                    disabled={isSaving}
                  />
                ) : referenceFieldConfig[field.name] ? (
                  <HrResourceSearchSelect
                    id={`${config.key}-${field.name}`}
                    value={formValues[field.name] || ''}
                    onValueChange={(referenceId) => setFormValues(current => ({ ...current, [field.name]: referenceId }))}
                    apiPath={referenceFieldConfig[field.name].apiPath}
                    labelKeys={referenceFieldConfig[field.name].labelKeys}
                    placeholder={`Search ${referenceFieldConfig[field.name].label.toLowerCase()}`}
                    disabled={isSaving}
                  />
                ) : field.type === 'textarea' ? (
                  <Textarea
                    id={`${config.key}-${field.name}`}
                    value={formValues[field.name] || ''}
                    onChange={(event) => setFormValues(current => ({ ...current, [field.name]: event.target.value }))}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`${config.key}-${field.name}`}
                    value={formValues[field.name] || field.options?.[0] || ''}
                    onChange={(event) => setFormValues(current => ({ ...current, [field.name]: event.target.value }))}
                    className="h-9 w-full rounded-[8px] border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring"
                  >
                    {(field.options || []).map(option => (
                      <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <Input
                    id={`${config.key}-${field.name}`}
                    type="file"
                    onChange={(event) => setFileValue(event.target.files?.[0] || null)}
                  />
                ) : (
                  <Input
                    id={`${config.key}-${field.name}`}
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                    value={formValues[field.name] || ''}
                    onChange={(event) => setFormValues(current => ({ ...current, [field.name]: event.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          {formError && <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeFormDialog} disabled={isSaving}>Cancel</Button>
            <Button type="button" onClick={() => void submitForm()} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRecord} onOpenChange={(open) => {
        if (!open) setDeleteRecord(null);
      }}>
        <DialogContent className="rounded-[8px]">
          <DialogHeader>
            <DialogTitle>Archive record</DialogTitle>
            <DialogDescription>
              This keeps the HR history but removes the record from active work where the module supports soft archive.
            </DialogDescription>
          </DialogHeader>
          {formError && <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteRecord(null)} disabled={isSaving}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={isSaving}>
              {isSaving ? 'Archiving...' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (config.key === 'people') {
    return (
      <>
        <EmployeeDirectoryTable
          resource={resource}
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          error={error}
          setDeleteRecord={setDeleteRecord}
          onEmployeeCreated={loadData}
        />
        {resourceDialogs}
      </>
    );
  }

  const workflowSteps = getWorkflowSteps(config.key);

  return (
    <main className="min-h-full px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-[8px] border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{config.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground sm:text-3xl">{config.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{config.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={openCreateDialog} disabled={resource.fields.length === 0}>
                <PlusIcon className="mr-2 h-4 w-4" />
                New {resource.fields.length > 0 ? 'case' : 'record'}
              </Button>
            </div>
          </div>
          {config.resourceViews && config.resourceViews.length > 1 && (
            <div className="flex gap-1 overflow-x-auto border-t border-border px-5 py-3">
              {config.resourceViews.map(view => (
                <button
                  key={view.view || 'default'}
                  type="button"
                  className={cn(
                    "rounded-[8px] px-3 py-2 text-sm font-semibold transition",
                    activeView === view.view
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                  onClick={() => setActiveView(view.view)}
                >
                  {view.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[8px] border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Workflow</p>
            <div className="mt-4 grid gap-3">
              {workflowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[8px] bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Operational focus</p>
            <h2 className="mt-2 text-lg font-bold text-foreground">{config.title} workbench</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this page to move HR work through its lifecycle. Create cases when work starts, use row actions for approvals or publishing, and keep profile history available from the employee record.
            </p>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {(data.metrics.length > 0 ? data.metrics : [
            { label: config.primaryMetricLabel, value: '0', helper: 'No data loaded' },
            { label: config.secondaryMetricLabel, value: '0', helper: 'No data loaded' },
            { label: 'Records', value: '0', helper: 'No data loaded' },
          ]).map((metric) => (
            <div key={metric.label} className="rounded-[8px] border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-primary">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[8px] border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Work Queue</h2>
              <p className="text-sm text-muted-foreground">{filteredRecords.length} visible</p>
            </div>
            <label className="relative block w-full md:w-80">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-[8px] border border-input bg-muted/35 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-ring"
                placeholder="Search records"
              />
            </label>
          </div>

          {error && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {error}
            </div>
          )}

          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-[8px] bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <article key={record.id} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[8px] bg-primary/10 text-primary">
                    <ClipboardDocumentListIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {config.key === 'people' ? (
                      <Link href={`/people/${record.id}`} className="block truncate text-sm font-bold text-foreground hover:text-primary">
                        {record.title}
                      </Link>
                    ) : (
                      <h3 className="truncate text-sm font-bold text-foreground">{record.title}</h3>
                    )}
                    <p className="truncate text-xs text-muted-foreground">{record.subtitle}</p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">{record.meta}</div>
                  <Badge variant="outline" className="rounded-full capitalize">
                    {record.status.replace(/_/g, ' ')}
                  </Badge>
                  {getWorkflowActions(config.key, record.status).map((action) => {
                    const isRunning = activeWorkflowId === `${record.id}:${action.action}`;
                    const Icon = action.tone === 'danger' ? XCircleIcon : action.tone === 'positive' ? CheckCircleIcon : PlayIcon;
                    return (
                      <Button
                        key={action.action}
                        type="button"
                        variant={action.tone === 'danger' ? 'outline' : 'secondary'}
                        size="sm"
                        className={cn('hidden h-8 gap-1.5 sm:inline-flex', action.tone === 'danger' && 'border-red-200 text-red-700 hover:bg-red-50')}
                        disabled={isRunning}
                        onClick={() => void runWorkflowAction(record.id, action.action)}
                      >
                        <Icon className="h-4 w-4" />
                        {isRunning ? 'Working...' : action.label}
                      </Button>
                    );
                  })}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 sm:h-9 sm:w-9"
                      aria-label={`Edit ${record.title}`}
                      onClick={() => openEditDialog(record.id)}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-destructive sm:h-9 sm:w-9"
                      aria-label={`Archive ${record.title}`}
                      onClick={() => {
                        const rawRecord = resource.records.find(item => item.id === record.id);
                        if (rawRecord) setDeleteRecord(rawRecord);
                      }}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-[8px] bg-muted text-muted-foreground">
                  <ClipboardDocumentListIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">{data.emptyTitle}</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{data.emptyDescription}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {resourceDialogs}
    </main>
  );
}
