"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowsPointingOutIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PencilSquareIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { DepartmentUnit } from '@/components/people/department-hierarchy-utils';
import {
  employeeName,
  getPositionHeadcount,
  text,
  type EmployeeNode,
  type PositionNode,
} from './org-chart-page-model';

export function OrgChartPositionCanvas({
  positions,
  employeesByPosition,
  units,
  canManagePeople,
  onEditPosition,
  onEditDivision,
  onEditDepartment,
}: {
  positions: PositionNode[];
  employeesByPosition: Record<string, EmployeeNode[]>;
  units: DepartmentUnit[];
  canManagePeople: boolean;
  onEditPosition: (position: PositionNode) => void;
  onEditDivision: (name: string) => void;
  onEditDepartment: (division: string, name: string) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [divisionFilter, setDivisionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedPositionId, setSelectedPositionId] = React.useState<string | null>(positions[0]?.id ?? null);
  const [zoom, setZoom] = React.useState(100);

  const divisionForDepartment = new Map<string, string>();
  for (const unit of units) {
    if (!divisionForDepartment.has(unit.department)) divisionForDepartment.set(unit.department, unit.division);
  }
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPositions = positions.filter(position => {
    const department = text(position.department, 'Unassigned department');
    const division = divisionForDepartment.get(department) || 'Unassigned division';
    const employees = employeesByPosition[position.id]
      || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`]
      || [];
    const headcount = getPositionHeadcount(position, employees);
    const matchesQuery = !normalizedQuery || [position.title, position.positionLevel, department, division]
      .some(value => text(value, '').toLowerCase().includes(normalizedQuery));
    const matchesDivision = divisionFilter === 'all' || division === divisionFilter;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'filled' ? headcount.vacant === 0 : headcount.vacant > 0);
    return matchesQuery && matchesDivision && matchesStatus;
  });
  const grouped = filteredPositions.reduce<Record<string, Record<string, PositionNode[]>>>((divisions, position) => {
    const department = text(position.department, 'Unassigned department');
    const division = divisionForDepartment.get(department) || 'Unassigned division';
    const departments = divisions[division] || {};
    departments[department] = [...(departments[department] || []), position];
    divisions[division] = departments;
    return divisions;
  }, {});
  const divisions = Array.from(new Set(positions.map(position => {
    const department = text(position.department, 'Unassigned department');
    return divisionForDepartment.get(department) || 'Unassigned division';
  })));
  const selectedPosition = positions.find(position => position.id === selectedPositionId) || null;
  const selectedEmployees = selectedPosition
    ? employeesByPosition[selectedPosition.id]
      || employeesByPosition[`position:${text(selectedPosition.title, 'Unassigned position')}`]
      || []
    : [];
  const totals = positions.reduce((summary, position) => {
    const employees = employeesByPosition[position.id]
      || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`]
      || [];
    const headcount = getPositionHeadcount(position, employees);
    summary.filled += headcount.filled;
    summary.vacant += headcount.vacant;
    return summary;
  }, { filled: 0, vacant: 0 });

  return (
    <section className="flex min-h-[680px] min-w-[960px] flex-col overflow-hidden rounded-[8px] border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <label className="relative min-w-[230px] flex-1 sm:max-w-[320px]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search positions..." className="h-10 w-full rounded-[6px] border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </label>
        <FilterSelect value={divisionFilter} onChange={setDivisionFilter} label="All divisions / departments" options={divisions} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All status" options={['filled', 'vacant']} />
        <Button type="button" variant="outline" className="h-10 gap-2" onClick={() => { setQuery(''); setDivisionFilter('all'); setStatusFilter('all'); setZoom(100); }}>
          Expand all <ArrowsPointingOutIcon className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <UsersIcon className="h-4 w-4" />
          <span><strong className="font-semibold text-foreground">{positions.length}</strong> positions</span>
          <span>•</span>
          <span><strong className="font-semibold text-foreground">{totals.filled}</strong> filled</span>
          <span>•</span>
          <span><strong className="font-semibold text-foreground">{totals.vacant}</strong> vacant</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(640px,1fr)_320px]">
        <div className="relative min-h-[610px] overflow-auto bg-background/35 p-8">
          {Object.keys(grouped).length === 0 ? (
            <div className="grid h-full place-items-center text-center"><div><p className="font-semibold">No positions found</p><p className="mt-1 text-sm text-muted-foreground">Try changing the search or filters.</p></div></div>
          ) : (
            <div className="origin-top-left space-y-16 pb-20 transition-transform" style={{ transform: `scale(${zoom / 100})` }}>
              {Object.entries(grouped).map(([division, departments]) => {
                const divisionPositions = Object.values(departments).flat();
                const divisionHeadcount = divisionPositions.reduce((sum, position) => {
                  const employees = employeesByPosition[position.id] || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`] || [];
                  const value = getPositionHeadcount(position, employees);
                  return { filled: sum.filled + value.filled, vacant: sum.vacant + value.vacant };
                }, { filled: 0, vacant: 0 });
                return (
                  <div key={division} className="mx-auto min-w-[700px] max-w-[920px]">
                    <DivisionNode name={division} positions={divisionPositions.length} {...divisionHeadcount} canEdit={canManagePeople && division !== 'Unassigned division'} onEdit={() => onEditDivision(division)} />
                    <div className="mx-auto h-14 w-px bg-border" />
                    <div className="relative flex justify-center gap-12 border-t border-border pt-10">
                      {Object.entries(departments).map(([department, departmentPositions]) => (
                        <div key={department} className="relative flex min-w-[300px] flex-1 flex-col items-center">
                          <div className="absolute -top-10 h-10 w-px bg-border" />
                          <DepartmentNode
                            name={department}
                            positions={departmentPositions.length}
                            filled={departmentPositions.reduce((sum, position) => sum + getPositionHeadcount(position, employeesByPosition[position.id] || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`] || []).filled, 0)}
                            vacant={departmentPositions.reduce((sum, position) => sum + getPositionHeadcount(position, employeesByPosition[position.id] || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`] || []).vacant, 0)}
                            canEdit={canManagePeople && department !== 'Unassigned department' && division !== 'Unassigned division'}
                            onEdit={() => onEditDepartment(division, department)}
                          />
                          <div className="h-12 w-px bg-border" />
                          <div className="grid gap-4">
                            {departmentPositions.map(position => (
                              <PositionCard
                                key={position.id}
                                position={position}
                                employees={employeesByPosition[position.id] || employeesByPosition[`position:${text(position.title, 'Unassigned position')}`] || []}
                                selected={selectedPositionId === position.id}
                                onSelect={() => setSelectedPositionId(position.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="sticky bottom-4 mx-auto flex w-fit items-center rounded-[6px] border border-border bg-card p-1 shadow-sm">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(value => Math.max(70, value - 10))}><MinusIcon className="h-4 w-4" /></Button>
            <span className="w-14 text-center text-xs font-semibold text-muted-foreground">{zoom}%</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(value => Math.min(130, value + 10))}><PlusIcon className="h-4 w-4" /></Button>
            <span className="mx-1 h-5 w-px bg-border" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(100)}><ArrowsPointingOutIcon className="h-4 w-4" /></Button>
          </div>
        </div>
        <PositionInspector position={selectedPosition} employees={selectedEmployees} canManage={canManagePeople} onClose={() => setSelectedPositionId(null)} onEdit={() => selectedPosition && onEditPosition(selectedPosition)} />
      </div>
    </section>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return (
    <label className="relative">
      <select value={value} onChange={event => onChange(event.target.value)} className="h-10 min-w-[170px] appearance-none rounded-[6px] border border-border bg-background px-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
        <option value="all">{label}</option>
        {options.map(option => <option key={option} value={option}>{option.replace(/(^|\s)\S/g, value => value.toUpperCase())}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}

function DivisionNode({ name, positions, filled, vacant, canEdit, onEdit }: { name: string; positions: number; filled: number; vacant: number; canEdit: boolean; onEdit: () => void }) {
  return <div className="mx-auto flex w-[390px] items-center gap-4 rounded-[8px] border border-border bg-card px-5 py-4 shadow-sm"><BuildingOffice2Icon className="h-7 w-7 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold uppercase tracking-wide">{name}</p><p className="mt-1 text-xs text-muted-foreground">{positions} positions &nbsp;•&nbsp; {filled} filled &nbsp;•&nbsp; {vacant} vacant</p></div>{canEdit && <EditIconButton label={`Edit ${name} division`} onClick={onEdit} />}</div>;
}

function DepartmentNode({ name, positions, filled, vacant, canEdit, onEdit }: { name: string; positions: number; filled: number; vacant: number; canEdit: boolean; onEdit: () => void }) {
  return <div className="flex w-[300px] items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-3 shadow-sm"><UsersIcon className="h-6 w-6 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{positions} position{positions === 1 ? '' : 's'} &nbsp;•&nbsp; {filled} filled &nbsp;•&nbsp; {vacant} vacant</p></div>{canEdit && <EditIconButton label={`Edit ${name} department`} onClick={onEdit} />}</div>;
}

function PositionCard({ position, employees, selected, onSelect }: { position: PositionNode; employees: EmployeeNode[]; selected: boolean; onSelect: () => void }) {
  const { total, filled, vacant } = getPositionHeadcount(position, employees);
  return (
    <article className={cn('w-[300px] cursor-pointer rounded-[8px] border bg-card p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md', selected ? 'border-primary ring-1 ring-primary' : 'border-border')} onClick={onSelect} tabIndex={0} role="button" aria-pressed={selected} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(); } }}>
      <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-card-foreground">{text(position.title, 'Untitled position')}</h3><p className="mt-1 truncate text-xs font-medium text-muted-foreground">{text(position.positionLevel, 'Level not set')}</p></div><PositionActionsMenu positionTitle={text(position.title, 'position')} /></div>
      <div className="mt-4 flex items-center gap-4"><div className={cn('grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border-[4px]', vacant === 0 ? 'border-emerald-500' : 'border-amber-500')}><div className="text-center"><p className="text-base font-bold leading-none">{filled}</p><p className="mt-1 text-[10px] text-muted-foreground">of {total}</p></div></div><div className="min-w-0 border-l border-border pl-4"><p className="text-sm text-muted-foreground">{filled} of {total} filled</p><p className="mt-2 flex items-center gap-2 text-sm"><span className={cn('h-2 w-2 rounded-full', vacant === 0 ? 'bg-emerald-500' : 'bg-amber-500')} />{vacant === 0 ? 'Filled' : `${vacant} vacant`}</p></div></div>
    </article>
  );
}

function PositionInspector({ position, employees, canManage, onClose, onEdit }: { position: PositionNode | null; employees: EmployeeNode[]; canManage: boolean; onClose: () => void; onEdit: () => void }) {
  if (!position) return <aside className="grid place-items-center border-l border-border bg-card p-6 text-center text-sm text-muted-foreground">Select a position to see details.</aside>;
  const { total, filled, vacant } = getPositionHeadcount(position, employees);
  const incumbent = employees[0];
  return (
    <aside className="overflow-auto border-l border-border bg-card">
      <div className="flex items-start justify-between gap-3 p-5"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">{text(position.title, 'Untitled position')}</h2><Badge variant="secondary" className="rounded-[4px] text-[10px] uppercase text-primary">Selected</Badge></div></div><Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><XMarkIcon className="h-5 w-5" /></Button></div>
      <div className="space-y-3 border-b border-border px-5 pb-5 text-sm"><InfoRow label="Role" value={text(position.title)} /><InfoRow label="Level" value={text(position.positionLevel)} /><InfoRow label="Department" value={text(position.department)} /><InfoRow label="Reports to" value="—" /></div>
      <div className="border-b border-border p-5"><h3 className="text-sm font-bold">Headcount</h3><div className="mt-4 space-y-3 text-sm"><InfoRow label="Approved headcount" value={String(total)} /><InfoRow label="Filled" value={String(filled)} /><InfoRow label="Vacant" value={String(vacant)} /></div></div>
      <div className="border-b border-border p-5"><h3 className="text-sm font-bold">Incumbent</h3>{incumbent ? <Link href={`/people/${incumbent.id}`} className="mt-4 flex items-center gap-3 rounded-[6px] p-2 hover:bg-muted"><span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-bold">{employeeName(incumbent).split(/\s+/).map(value => value[0]).slice(0, 2).join('')}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{employeeName(incumbent)}</span><span className="block truncate text-xs text-muted-foreground">Employee • {text(incumbent.id)}</span></span><ChevronDownIcon className="ml-auto h-4 w-4 -rotate-90 text-muted-foreground" /></Link> : <p className="mt-3 text-sm text-muted-foreground">No employee assigned.</p>}</div>
      {canManage && <div className="p-5"><h3 className="text-sm font-bold">Actions</h3><div className="mt-4 grid grid-cols-2 gap-3"><Button type="button" variant="outline" className="gap-2" onClick={onEdit}><PencilSquareIcon className="h-4 w-4" />Edit position</Button><Button asChild className="gap-2"><Link href="/hiring/headcount-requests"><UserPlusIcon className="h-4 w-4" />Add opening</Link></Button></div></div>}
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium text-foreground">{value}</span></div>;
}

function PositionActionsMenu({ positionTitle }: { positionTitle: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label={`Staffing actions for ${positionTitle}`}><EllipsisVerticalIcon className="h-5 w-5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild><Link href="/people"><UserPlusIcon className="mr-2 h-4 w-4" />Add existing employee</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/hiring/headcount-requests"><BriefcaseIcon className="mr-2 h-4 w-4" />Request new headcount</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label={label} title={label} onClick={onClick}><PencilSquareIcon className="h-4 w-4" /></Button>;
}
