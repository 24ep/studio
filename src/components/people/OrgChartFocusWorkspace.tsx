"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowsPointingOutIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { DepartmentUnit } from './department-hierarchy-utils';
import {
  ChangeManagerDialog,
  ChangeSummary,
  Connector,
  EmployeeAvatar,
  EmployeeDetailDialog,
  EmployeeInspector,
  FocusNode,
  IconButton,
} from './OrgChartFocusParts';
import {
  defaultFocusEmployeeId,
  departmentName,
  employeeName,
  employeeRole,
  type InspectorTab,
  type OrgChartFocusEmployee,
  type PendingManagerChange,
} from './OrgChartFocusModel';

export type { OrgChartFocusEmployee } from './OrgChartFocusModel';

export function OrgChartFocusWorkspace({
  employees,
  units,
  canManage,
  onPositionView,
  onManagerChanged,
}: {
  employees: OrgChartFocusEmployee[];
  units: DepartmentUnit[];
  canManage: boolean;
  onPositionView: () => void;
  onManagerChanged: () => Promise<void> | void;
}) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [query, setQuery] = React.useState('');
  const [department, setDepartment] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(() => defaultFocusEmployeeId(employees));
  const [inspectorTab, setInspectorTab] = React.useState<InspectorTab>('reporting');
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [pendingChange, setPendingChange] = React.useState<PendingManagerChange | null>(null);
  const [isSavingManager, setIsSavingManager] = React.useState(false);
  const [managerDialogEmployee, setManagerDialogEmployee] = React.useState<OrgChartFocusEmployee | null>(null);
  const [managerSelection, setManagerSelection] = React.useState('none');
  const [isSavingManagerDialog, setIsSavingManagerDialog] = React.useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedId || !employees.some(employee => employee.id === selectedId)) {
      setSelectedId(defaultFocusEmployeeId(employees));
    }
  }, [employees, selectedId]);

  React.useEffect(() => {
    if (!draggingId) return;
    const cancelDrag = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDraggingId(null);
      setDragOverId(null);
    };
    window.addEventListener('keydown', cancelDrag);
    return () => window.removeEventListener('keydown', cancelDrag);
  }, [draggingId]);

  const departments = React.useMemo(
    () => Array.from(new Set(employees.map(employee => departmentName(employee, units)))).sort(),
    [employees, units],
  );
  const selected = employees.find(employee => employee.id === selectedId) || employees[0];
  const manager = selected?.managerId ? employees.find(employee => employee.id === selected.managerId) || null : null;
  const peers = selected
    ? employees.filter(employee => (employee.managerId || null) === (selected.managerId || null))
    : [];
  const reports = selected ? employees.filter(employee => employee.managerId === selected.id) : [];
  const visiblePeers = peers.slice(0, 6);
  const visibleReports = reports.slice(0, 6);
  const searchResults = query.trim()
    ? employees.filter(employee => {
      const matchesQuery = `${employeeName(employee)} ${employeeRole(employee)}`.toLowerCase().includes(query.toLowerCase());
      const matchesDepartment = department === 'all' || departmentName(employee, units) === department;
      return matchesQuery && matchesDepartment;
    }).slice(0, 7)
    : [];

  const descendantIds = React.useMemo(() => {
    if (!draggingId) return new Set<string>();
    const descendants = new Set<string>();
    const queue = [draggingId];
    while (queue.length > 0) {
      const parentId = queue.shift();
      employees.filter(employee => employee.managerId === parentId).forEach(employee => {
        if (!descendants.has(employee.id)) {
          descendants.add(employee.id);
          queue.push(employee.id);
        }
      });
    }
    return descendants;
  }, [draggingId, employees]);

  const canDropOn = React.useCallback((targetId: string) => {
    if (!draggingId || draggingId === targetId || descendantIds.has(targetId)) return false;
    return employees.find(employee => employee.id === draggingId)?.managerId !== targetId;
  }, [descendantIds, draggingId, employees]);

  const beginManagerDrag = (employee: OrgChartFocusEmployee, event: React.DragEvent<HTMLButtonElement>) => {
    if (!canManage) return;
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', employee.id);
    setSelectedId(employee.id);
    setInspectorOpen(true);
    setPendingChange(null);
    setDraggingId(employee.id);
  };

  const dropManagerEdge = (target: OrgChartFocusEmployee, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canDropOn(target.id) || !draggingId) return;
    const movedEmployee = employees.find(employee => employee.id === draggingId);
    if (!movedEmployee) return;
    setPendingChange({
      employee: movedEmployee,
      previousManager: movedEmployee.managerId ? employees.find(employee => employee.id === movedEmployee.managerId) || null : null,
      newManager: target,
    });
    setDragOverId(null);
    setDraggingId(null);
    setInspectorOpen(true);
  };

  const applyManagerChange = async () => {
    if (!pendingChange || isSavingManager) return;
    const employee = pendingChange.employee;
    setIsSavingManager(true);
    try {
      const response = await fetch('/api/hr/org-chart', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'employee',
          id: employee.id,
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          jobTitle: employee.jobTitle || employee.positionTitle || employee.position?.title || null,
          status: employee.status || 'active',
          location: employee.location || null,
          managerId: pendingChange.newManager.id,
          departmentId: employee.departmentId || null,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to change manager.');
      await onManagerChanged();
      setPendingChange(null);
      toastSuccess(`${employeeName(employee)} now reports to ${employeeName(pendingChange.newManager)}.`);
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to change manager.');
    } finally {
      setIsSavingManager(false);
    }
  };

  const openManagerDialog = (employee: OrgChartFocusEmployee) => {
    setManagerDialogEmployee(employee);
    setManagerSelection(employee.managerId || 'none');
  };

  const saveManagerFromDialog = async () => {
    if (!managerDialogEmployee || isSavingManagerDialog) return;
    setIsSavingManagerDialog(true);
    try {
      const response = await fetch('/api/hr/org-chart', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'employee',
          id: managerDialogEmployee.id,
          firstName: managerDialogEmployee.firstName || '',
          lastName: managerDialogEmployee.lastName || '',
          email: managerDialogEmployee.email || '',
          jobTitle: managerDialogEmployee.jobTitle || managerDialogEmployee.positionTitle || managerDialogEmployee.position?.title || null,
          status: managerDialogEmployee.status || 'active',
          location: managerDialogEmployee.location || null,
          managerId: managerSelection === 'none' ? null : managerSelection,
          departmentId: managerDialogEmployee.departmentId || null,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to change manager.');
      await onManagerChanged();
      toastSuccess(`${employeeName(managerDialogEmployee)} reporting line updated.`);
      setManagerDialogEmployee(null);
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to change manager.');
    } finally {
      setIsSavingManagerDialog(false);
    }
  };

  if (!selected) return null;

  return (
    <section className="space-y-5" aria-label="Focused organization chart">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Chart</h1>
          <p className="mt-1 text-sm text-muted-foreground">Explore reporting lines and team structure. All data as of Aug 10, 2026.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
          <div className="flex shrink-0 rounded-lg border border-border bg-muted p-1">
            <button type="button" className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-primary shadow-sm">Employee</button>
            <button type="button" onClick={onPositionView} className="rounded-md px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">Position</button>
          </div>
          <div className="relative min-w-[240px] flex-1 sm:max-w-[360px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search people"
              className="h-10 pl-9 pr-9"
              aria-label="Search people in organization chart"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted" aria-label="Clear search">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            {searchResults.length > 0 && (
              <div className="absolute left-0 top-12 z-40 w-full min-w-[320px] overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                {searchResults.map(employee => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => { setSelectedId(employee.id); setQuery(''); setInspectorTab('reporting'); setInspectorOpen(true); }}
                    className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-muted"
                  >
                    <EmployeeAvatar employee={employee} className="h-9 w-9" />
                    <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{employeeName(employee)}</strong><span className="block truncate text-xs text-muted-foreground">{employeeRole(employee)}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="relative">
            <span className="sr-only">Filter by department</span>
            <select value={department} onChange={event => {
              const nextDepartment = event.target.value;
              setDepartment(nextDepartment);
              if (nextDepartment !== 'all' && departmentName(selected, units) !== nextDepartment) {
                const nextEmployee = employees.find(employee => departmentName(employee, units) === nextDepartment);
                if (nextEmployee) setSelectedId(nextEmployee.id);
              }
            }} className="h-10 min-w-44 appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All departments</option>
              {departments.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <ChevronRightIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </label>
          <Button asChild className="h-10 shrink-0 gap-2"><Link href="/people"><PlusIcon className="h-4 w-4" />Add person</Link></Button>
        </div>
      </header>

      <div className={cn('grid h-[calc(100vh-235px)] min-h-[680px] gap-2', inspectorOpen && 'xl:grid-cols-[minmax(720px,1fr)_396px]')}>
        <div className="relative min-w-0 overflow-hidden rounded-lg border border-border bg-card">
          <div className="relative h-full overflow-auto bg-muted/15 p-6">
            <div className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Executive Leadership</span><span>/</span><span>{departmentName(selected, units)}</span><span>/</span><span className="font-medium text-primary">{employeeRole(selected)}</span>
            </div>

            <div className="relative z-10 mt-8 min-w-[700px] origin-top transition-transform" style={{ transform: `scale(${zoom})` }}>
              {manager ? (
                <div className="flex justify-center">
                  <FocusNode employee={manager} reportCount={employees.filter(item => item.managerId === manager.id).length} onSelect={() => { setSelectedId(manager.id); setInspectorOpen(true); }} compact canManage={canManage} draggingId={draggingId} dragOverId={dragOverId} canDrop={canDropOn(manager.id)} onDragStart={beginManagerDrag} onDragOver={event => { event.preventDefault(); if (canDropOn(manager.id)) setDragOverId(manager.id); }} onDragLeave={() => setDragOverId(current => current === manager.id ? null : current)} onDrop={event => dropManagerEdge(manager, event)} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }} />
                </div>
              ) : (
                <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Top-level employee</p>
              )}

              <Connector />

              <div className="relative mx-auto flex max-w-[820px] justify-center gap-5 border-t border-border pt-9">
                {visiblePeers.map((employee, index) => (
                  <div key={employee.id} className="relative before:absolute before:-top-9 before:left-1/2 before:h-9 before:border-l before:border-border">
                    <FocusNode
                      employee={employee}
                      reportCount={employees.filter(item => item.managerId === employee.id).length}
                      selected={employee.id === selected.id}
                      muted={employee.id !== selected.id && (index === 0 || index === visiblePeers.length - 1) && visiblePeers.length > 3}
                      onSelect={() => { setSelectedId(employee.id); setInspectorTab('reporting'); setInspectorOpen(true); }}
                      canManage={canManage}
                      draggingId={draggingId}
                      dragOverId={dragOverId}
                      canDrop={canDropOn(employee.id)}
                      onDragStart={beginManagerDrag}
                      onDragOver={event => { event.preventDefault(); if (canDropOn(employee.id)) setDragOverId(employee.id); }}
                      onDragLeave={() => setDragOverId(current => current === employee.id ? null : current)}
                      onDrop={event => dropManagerEdge(employee, event)}
                      onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                    />
                  </div>
                ))}
              </div>

              {visibleReports.length > 0 && (
                <>
                  <Connector />
                  <div className="relative mx-auto grid max-w-[920px] grid-cols-6 gap-3 border-t border-border pt-9">
                    {visibleReports.map(employee => (
                      <div key={employee.id} className="relative before:absolute before:-top-9 before:left-1/2 before:h-9 before:border-l before:border-border">
                        <FocusNode employee={employee} reportCount={employees.filter(item => item.managerId === employee.id).length} onSelect={() => { setSelectedId(employee.id); setInspectorTab('reporting'); setInspectorOpen(true); }} small canManage={canManage} draggingId={draggingId} dragOverId={dragOverId} canDrop={canDropOn(employee.id)} onDragStart={beginManagerDrag} onDragOver={event => { event.preventDefault(); if (canDropOn(employee.id)) setDragOverId(employee.id); }} onDragLeave={() => setDragOverId(current => current === employee.id ? null : current)} onDrop={event => dropManagerEdge(employee, event)} onDragEnd={() => { setDraggingId(null); setDragOverId(null); }} />
                      </div>
                    ))}
                  </div>
                  {reports.length > visibleReports.length && <p className="mt-4 text-center text-xs text-muted-foreground">+{reports.length - visibleReports.length} more direct reports</p>}
                </>
              )}
            </div>

            <div className="absolute bottom-5 right-5 z-20 flex items-center rounded-lg border border-border bg-card p-1 shadow-lg">
              <IconButton label="Zoom out" onClick={() => setZoom(current => Math.max(.75, current - .1))}><MagnifyingGlassMinusIcon /></IconButton>
              <span className="w-14 text-center text-xs font-semibold tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <IconButton label="Zoom in" onClick={() => setZoom(current => Math.min(1.25, current + .1))}><MagnifyingGlassPlusIcon /></IconButton>
              <span className="mx-1 h-5 w-px bg-border" />
              <IconButton label="Fit chart" onClick={() => setZoom(1)}><ArrowsPointingOutIcon /></IconButton>
            </div>
            {draggingId && <div className="absolute bottom-5 left-5 z-20 flex h-11 min-w-[360px] items-center justify-center rounded-lg border border-border bg-card px-5 text-sm text-muted-foreground shadow-lg">Moving <strong className="mx-2 text-primary">{employeeName(employees.find(employee => employee.id === draggingId) || selected)}</strong><span className="mx-2 text-border">•</span>Esc to cancel</div>}
          </div>
        </div>

        {pendingChange ? <ChangeSummary
          change={pendingChange}
          reportCount={employees.filter(employee => employee.managerId === pendingChange.employee.id).length}
          isSaving={isSavingManager}
          onCancel={() => setPendingChange(null)}
          onApply={() => void applyManagerChange()}
        /> : inspectorOpen && <EmployeeInspector
          employee={selected}
          manager={manager}
          reports={reports}
          units={units}
          activeTab={inspectorTab}
          onTabChange={setInspectorTab}
          onSelectEmployee={id => { setSelectedId(id); setInspectorOpen(true); }}
          onClose={() => setInspectorOpen(false)}
          onChangeManager={() => openManagerDialog(selected)}
          onOpenDetails={() => setDetailEmployeeId(selected.id)}
          canManage={canManage}
        />}
      </div>

      <ChangeManagerDialog
        employee={managerDialogEmployee}
        employees={employees}
        value={managerSelection}
        isSaving={isSavingManagerDialog}
        onValueChange={setManagerSelection}
        onOpenChange={open => !open && setManagerDialogEmployee(null)}
        onSave={() => void saveManagerFromDialog()}
      />
      <EmployeeDetailDialog employeeId={detailEmployeeId} onOpenChange={open => !open && setDetailEmployeeId(null)} />
    </section>
  );
}
