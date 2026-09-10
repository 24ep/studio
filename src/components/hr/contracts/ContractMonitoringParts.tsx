"use client";

import {
  CalendarDaysIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContractEmployeeWithExpiry, ContractFilters, ContractView } from './contract-monitoring-types';
import { displayType, employeeInitials, employeeName } from './contract-monitoring-utils';

export function ContractEmployeeIdentity({ employee, compact = false }: { employee: ContractEmployeeWithExpiry; compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={cn('shrink-0 rounded-full ring-1 ring-border', compact ? 'h-8 w-8' : 'h-10 w-10')}>
        <AvatarImage src={employee.employeeAvatarUrl || undefined} alt="" className="rounded-full object-cover" />
        <AvatarFallback className="rounded-full bg-primary/15 text-xs font-bold text-primary">{employeeInitials(employee)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{employeeName(employee)}</p>
        <p className="truncate text-xs text-muted-foreground">{compact ? employee.employeeNumber : employee.email || employee.employeeNumber}</p>
      </div>
    </div>
  );
}

export function ContractStatePill({ employee }: { employee: ContractEmployeeWithExpiry }) {
  const state = employee.expiry.state;
  const label = state === 'missing_end_date'
    ? 'Missing end date'
    : state === 'expired'
      ? 'Expired'
      : state === 'due'
        ? 'Needs attention'
        : 'Active';
  return (
    <span className={cn(
      'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
      state === 'expired' && 'bg-red-500/15 text-red-700 dark:text-red-300',
      state === 'due' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      state === 'missing_end_date' && 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      state === 'scheduled' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    )}>{label}</span>
  );
}

export function ContractViewSwitcher({ value, onChange }: { value: ContractView; onChange: (view: ContractView) => void }) {
  const items: Array<{ value: ContractView; label: string; icon: typeof TableCellsIcon }> = [
    { value: 'table', label: 'Monitor', icon: TableCellsIcon },
    { value: 'timeline', label: 'Timeline', icon: CalendarDaysIcon },
    { value: 'workflow', label: 'Workflow', icon: Squares2X2Icon },
  ];
  return (
    <div className="inline-flex h-10 rounded-md border border-border bg-muted/30 p-1" aria-label="Contract view">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)} className={cn('inline-flex items-center gap-2 rounded px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground', value === item.value && 'bg-primary text-primary-foreground shadow-sm')}>
            <Icon className="h-4 w-4" />{item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ContractFiltersBar({ filters, onChange, contracts }: { filters: ContractFilters; onChange: (filters: ContractFilters) => void; contracts: ContractEmployeeWithExpiry[] }) {
  const types = Array.from(new Set(contracts.map(contract => contract.employmentType))).sort();
  const clients = Array.from(new Set(contracts.map(contract => contract.clientName || contract.departmentName).filter(Boolean) as string[])).sort();
  const locations = Array.from(new Set(contracts.map(contract => contract.location).filter(Boolean) as string[])).sort();
  const selectClass = 'h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-5 py-3 lg:px-6">
      <label className="relative min-w-64 flex-1 lg:max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={filters.query} onChange={event => onChange({ ...filters, query: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Search contract employees" />
      </label>
      <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground xl:inline-flex"><FunnelIcon className="h-4 w-4" />Filters</span>
      <select aria-label="Employment type" value={filters.employmentType} onChange={event => onChange({ ...filters, employmentType: event.target.value })} className={selectClass}><option value="all">All types</option>{types.map(type => <option key={type} value={type}>{displayType(type)}</option>)}</select>
      <select aria-label="Client or department" value={filters.client} onChange={event => onChange({ ...filters, client: event.target.value })} className={selectClass}><option value="all">All clients</option>{clients.map(client => <option key={client} value={client}>{client}</option>)}</select>
      <select aria-label="Location" value={filters.location} onChange={event => onChange({ ...filters, location: event.target.value })} className={selectClass}><option value="all">All locations</option>{locations.map(location => <option key={location} value={location}>{location}</option>)}</select>
      <select aria-label="Contract state" value={filters.state} onChange={event => onChange({ ...filters, state: event.target.value })} className={selectClass}>
        <option value="all">All states</option><option value="attention">Needs attention</option><option value="due">Within notice period</option><option value="expired">Expired</option><option value="missing_end_date">Missing end date</option><option value="scheduled">Healthy</option>
      </select>
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ query: '', employmentType: 'all', client: 'all', location: 'all', state: 'all' })}>Clear</Button>
    </div>
  );
}

