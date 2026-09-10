"use client";

import * as React from 'react';
import {
  ArrowPathIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ContractEmployeeWithExpiry } from './contract-monitoring-types';
import { displayType, employeeInitials, employeeName, formatShortDate } from './contract-monitoring-utils';
import { ContractDetailPanel } from './ContractTableView';

const windowStart = new Date('2026-08-10T00:00:00.000Z');
const totalDays = 42;
const weeks = [
  ['Aug 10 – Aug 16', 'W33'], ['Aug 17 – Aug 23', 'W34'], ['Aug 24 – Aug 30', 'W35'],
  ['Aug 31 – Sep 6', 'W36'], ['Sep 7 – Sep 13', 'W37'], ['Sep 14 – Sep 20', 'W38'],
];

interface TimelineFilters {
  employmentType: string;
  client: string;
  owner: string;
  location: string;
}

const emptyFilters: TimelineFilters = { employmentType: 'all', client: 'all', owner: 'all', location: 'all' };

export function ContractTimelineView({ contracts, selected, onSelect }: { contracts: ContractEmployeeWithExpiry[]; selected: ContractEmployeeWithExpiry | null; onSelect: (employee: ContractEmployeeWithExpiry | null) => void }) {
  const [filters, setFilters] = React.useState<TimelineFilters>(emptyFilters);
  const filtered = React.useMemo(() => contracts.filter(contract => (
    (filters.employmentType === 'all' || contract.employmentType === filters.employmentType)
    && (filters.client === 'all' || (contract.clientName || contract.departmentName) === filters.client)
    && (filters.owner === 'all' || contract.owner === filters.owner)
    && (filters.location === 'all' || contract.location === filters.location)
  )), [contracts, filters]);

  const overdue = filtered.filter(contract => contract.expiry.state === 'expired').slice(0, 2);
  const dueWeek = filtered.filter(contract => contract.expiry.daysRemaining !== null && contract.expiry.daysRemaining >= 0 && contract.expiry.daysRemaining <= 7).slice(0, 2);
  const dueMonth = filtered.filter(contract => contract.expiry.daysRemaining !== null && contract.expiry.daysRemaining > 7 && contract.expiry.daysRemaining <= 30).slice(0, 3);
  const missing = filtered.filter(contract => contract.expiry.state === 'missing_end_date').slice(0, 2);
  const reserved = new Set([...overdue, ...dueWeek, ...dueMonth, ...missing].map(contract => contract.id));
  const scheduled = filtered.filter(contract => contract.expiry.state === 'scheduled' && !reserved.has(contract.id));
  const remaining = [...scheduled, ...filtered.filter(contract => contract.expiry.state !== 'scheduled' && !reserved.has(contract.id))];
  const visible = [...overdue, ...dueWeek, ...dueMonth, ...missing, ...remaining].slice(0, 10);
  const selectedEmployee = selected && visible.some(contract => contract.id === selected.id) ? selected : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <TimelineFiltersBar contracts={contracts} filters={filters} onChange={setFilters} />
      <div className="flex min-h-0 flex-1 overflow-hidden border-b border-border">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex h-full min-w-[980px] flex-col">
            <div className="sticky top-0 z-10 grid h-[62px] grid-cols-[200px_repeat(6,minmax(120px,1fr))] border-b border-border bg-card/95 backdrop-blur">
              <div className="px-5 py-3 text-xs font-semibold">Employee <span className="mt-1 block font-normal text-muted-foreground">{visible.length} total</span></div>
              {weeks.map(([label, week]) => <div key={week} className="border-l border-border px-2 py-3 text-center text-xs font-semibold"><span>{label}</span><span className="mt-1 block font-normal text-muted-foreground">{week}</span></div>)}
            </div>
            <div className="relative grid min-h-[560px] flex-1" style={{ gridTemplateRows: `repeat(${Math.max(visible.length, 1)}, minmax(54px, 1fr))` }}>
              <div className="pointer-events-none absolute inset-y-0 z-[3] w-px bg-blue-400" style={{ left: 'calc(200px + (100% - 200px) / 6)' }}><span className="absolute top-0 -translate-x-1/2 rounded-b bg-blue-500 px-2 py-1 text-[9px] font-bold text-white">TODAY</span></div>
              {visible.map((employee, index) => <TimelineRow key={employee.id} employee={employee} index={index} selected={selectedEmployee?.id === employee.id} onSelect={() => onSelect(employee)} />)}
              {visible.length === 0 && <div className="grid h-[520px] place-items-center text-sm text-muted-foreground">No contracts match these filters.</div>}
            </div>
          </div>
          </div>
        </div>
      </div>
      <Sheet open={Boolean(selectedEmployee)} onOpenChange={open => { if (!open) onSelect(null); }}>
        {selectedEmployee && <ContractDetailPanel employee={selectedEmployee} onClose={() => onSelect(null)} />}
      </Sheet>
    </div>
  );
}

function TimelineFiltersBar({ contracts, filters, onChange }: { contracts: ContractEmployeeWithExpiry[]; filters: TimelineFilters; onChange: (filters: TimelineFilters) => void }) {
  const types = Array.from(new Set(contracts.map(contract => contract.employmentType))).sort();
  const clients = Array.from(new Set(contracts.map(contract => contract.clientName || contract.departmentName).filter(Boolean) as string[])).sort();
  const owners = Array.from(new Set(contracts.map(contract => contract.owner))).sort();
  const locations = Array.from(new Set(contracts.map(contract => contract.location).filter(Boolean) as string[])).sort();
  const selectClass = 'h-10 min-w-0 flex-1 appearance-none bg-transparent pr-7 text-sm font-semibold text-foreground outline-none';
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-card px-5 py-3 lg:px-6">
      <TimelineSelect label="Employment type" value={filters.employmentType} onChange={value => onChange({ ...filters, employmentType: value })} className={selectClass}><option value="all">All</option>{types.map(type => <option key={type} value={type}>{displayType(type)}</option>)}</TimelineSelect>
      <TimelineSelect label="Client" value={filters.client} onChange={value => onChange({ ...filters, client: value })} className={selectClass}><option value="all">All</option>{clients.map(client => <option key={client} value={client}>{client}</option>)}</TimelineSelect>
      <TimelineSelect label="Owner" value={filters.owner} onChange={value => onChange({ ...filters, owner: value })} className={selectClass}><option value="all">All</option>{owners.map(owner => <option key={owner} value={owner}>{owner}</option>)}</TimelineSelect>
      <TimelineSelect label="Location" value={filters.location} onChange={value => onChange({ ...filters, location: value })} className={selectClass}><option value="all">All</option>{locations.map(location => <option key={location} value={location}>{location}</option>)}</TimelineSelect>
      <Button type="button" variant="ghost" size="sm" className="ml-auto text-blue-500 hover:text-blue-400" onClick={() => onChange(emptyFilters)}><ArrowPathIcon className="mr-2 h-4 w-4" />Clear filters</Button>
    </div>
  );
}

function TimelineSelect({ label, value, onChange, className, children }: { label: string; value: string; onChange: (value: string) => void; className: string; children: React.ReactNode }) {
  return <label className="relative flex h-10 min-w-[180px] flex-1 items-center gap-3 rounded-md border border-input bg-background px-3 lg:max-w-[230px]"><span className="shrink-0 text-xs text-muted-foreground">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className={className}>{children}</select><ChevronDownIcon className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" /></label>;
}

function TimelineIdentity({ employee, kind = 'queue' }: { employee: ContractEmployeeWithExpiry; kind?: 'queue' | 'row' | 'detail' }) {
  const avatarTones = ['bg-pink-500 text-white', 'bg-teal-500 text-white', 'bg-indigo-500 text-white', 'bg-emerald-600 text-white'];
  const tone = avatarTones[[...employee.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % avatarTones.length];
  const department = employee.departmentName || employee.clientName || 'Unassigned';
  return <div className="flex min-w-0 items-center gap-3"><Avatar className={cn('shrink-0 rounded-full ring-1 ring-border', kind === 'detail' ? 'h-11 w-11' : 'h-9 w-9')}><AvatarImage src={employee.employeeAvatarUrl || undefined} alt="" className="rounded-full object-cover" /><AvatarFallback className={cn('rounded-full text-[10px] font-bold', tone)}>{employeeInitials(employee)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{employeeName(employee)}</p><p className="truncate text-[10px] text-muted-foreground">{kind === 'queue' ? `${employee.employeeNumber} · ${department}` : `${displayType(employee.employmentType)} · ${department}`}</p>{kind === 'detail' && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{employee.employeeNumber}</p>}</div></div>;
}

function TimelineRow({ employee, index, selected, onSelect }: { employee: ContractEmployeeWithExpiry; index: number; selected: boolean; onSelect: () => void }) {
  const missing = employee.expiry.state === 'missing_end_date';
  const expired = employee.expiry.state === 'expired';
  const endOffset = employee.endDate ? Math.round((new Date(`${employee.endDate}T00:00:00.000Z`).valueOf() - windowStart.valueOf()) / 86_400_000) : null;
  const endPercent = expired ? 32 + index * 3 : Math.max(45, Math.min(96, 40 + (endOffset ?? 20) * 1.4));
  const noticeWidth = expired ? 0 : Math.min(16, Math.max(10, (employee.expiry.noticeDays || 14) / totalDays * 18));
  const activeWidth = Math.max(16, endPercent - noticeWidth);
  return (
    <button type="button" onClick={onSelect} className={cn('grid min-h-[54px] w-full grid-cols-[200px_1fr] border-b border-border text-left transition-colors hover:bg-muted/25', selected && 'bg-primary/10 hover:bg-primary/10')}>
      <div className={cn('flex items-center border-l-2 px-4', selected ? 'border-primary' : 'border-transparent')}><TimelineIdentity employee={employee} kind="row" /></div>
      <div className="relative border-l border-border">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-6" aria-hidden="true">{weeks.map(([, week]) => <span key={week} className="border-r border-border last:border-r-0" />)}</div>
        {missing ? (
          <div className="absolute top-1/2 h-[30px] -translate-y-1/2 rounded-r bg-slate-500/65 px-3 py-1.5 text-[11px] font-medium text-slate-100" style={{ left: '0%', width: '43%' }}>Missing end date</div>
        ) : expired ? (
          <><div className="absolute top-1/2 h-[30px] -translate-y-1/2 rounded-l bg-red-500/45 px-3 py-1.5 text-[11px] font-medium text-red-100" style={{ left: '0%', width: `${endPercent}%` }}>Contract ended</div><EndMarker percent={endPercent} label={formatShortDate(employee.endDate).replace(', 2026', '')} tone="red" /></>
        ) : (
          <><div className="absolute top-1/2 h-[30px] -translate-y-1/2 rounded-l bg-emerald-600/70 px-3 py-1.5 text-[11px] font-medium text-white" style={{ left: '0%', width: `${activeWidth}%` }}>Active</div><div className="absolute top-1/2 h-[30px] -translate-y-1/2 rounded-r bg-amber-500/55 px-3 py-1.5 text-[11px] font-medium text-amber-50" style={{ left: `${activeWidth}%`, width: `${noticeWidth}%` }}>Notice</div><EndMarker percent={endPercent} label={formatShortDate(employee.endDate).replace(', 2026', '')} tone="amber" /></>
        )}
      </div>
    </button>
  );
}

function EndMarker({ percent, label, tone }: { percent: number; label: string; tone: 'red' | 'amber' }) {
  return <><span className={cn('absolute top-1/2 z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background', tone === 'red' ? 'bg-red-400' : 'bg-amber-400')} style={{ left: `${percent}%` }} /><span className={cn('absolute top-1/2 -translate-y-1/2 translate-x-2 text-[10px] font-semibold', tone === 'red' ? 'text-red-400' : 'text-amber-400')} style={{ left: `${percent}%` }}>{label}</span></>;
}
