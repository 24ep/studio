"use client";

import * as React from 'react';
import { BriefcaseBusiness, Building2, Loader2, Mail, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { DepartmentUnit } from './department-hierarchy-utils';

interface EmployeeRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeNumber?: string;
  jobTitle?: string;
  positionTitle?: string;
  location?: string;
  status?: string;
  departmentId?: string | null;
  employeeAvatarUrl?: string | null;
}

interface EmployeesApiResponse {
  resource?: { records?: EmployeeRecord[] };
  message?: string;
}

export function DepartmentUnitDrawer({
  unit,
  units,
  onOpenChange,
}: {
  unit: DepartmentUnit | null;
  units: DepartmentUnit[];
  onOpenChange: (open: boolean) => void;
}) {
  const [employees, setEmployees] = React.useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!unit) return;
    const controller = new AbortController();
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/hr/employees', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json() as EmployeesApiResponse;
        if (!response.ok) throw new Error(data.message || 'Failed to load employees');
        const includedIds = getDescendantIds(unit.id, units);
        setEmployees((data.resource?.records || []).filter(employee => (
          employee.departmentId ? includedIds.has(employee.departmentId) : false
        )));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load employees');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void loadEmployees();
    return () => controller.abort();
  }, [unit, units]);

  const parent = unit?.parentId ? units.find(item => item.id === unit.parentId) : null;
  const unitById = React.useMemo(() => new Map(units.map(item => [item.id, item])), [units]);

  return (
    <Sheet open={Boolean(unit)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl" sheetId="department-unit-details">
        {unit && (
          <>
            <SheetHeader className="border-b bg-muted/20 px-5 py-5 pr-14 text-left">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                <Badge variant="outline" className="capitalize">{unit.unitType}</Badge>
                <Badge variant={unit.isActive ? 'default' : 'secondary'}>{unit.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <SheetTitle className="text-xl">{unit.name}</SheetTitle>
              <SheetDescription>{unit.description || `Information and employees for this ${unit.unitType}.`}</SheetDescription>
            </SheetHeader>

            <div className="space-y-7 p-5">
              <section aria-labelledby="unit-information-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id="unit-information-heading" className="text-sm font-semibold">{capitalize(unit.unitType)} information</h2>
                  <span className="text-xs text-muted-foreground">{unit.code || 'No code'}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-y py-4 text-sm">
                  <Info label="Type" value={capitalize(unit.unitType)} />
                  <Info label="Status" value={unit.isActive ? 'Active' : 'Inactive'} />
                  <Info label="Code" value={unit.code || 'Not assigned'} />
                  <Info label="Parent" value={parent?.name || 'Top level'} />
                  <Info label="Headcount allocation" value={unit.headcountAllocation === null ? 'Unlimited' : String(unit.headcountAllocation)} />
                  <Info label="Reserved headcount" value={String(unit.headcountUsage)} />
                  <Info
                    label="Remaining headcount"
                    value={unit.headcountAllocation === null ? 'Unlimited' : String(Math.max(0, unit.headcountAllocation - unit.headcountUsage))}
                  />
                </dl>
              </section>

              <section aria-labelledby="unit-employees-heading">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h2 id="unit-employees-heading" className="text-sm font-semibold">Employees</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Includes employees in child organization units.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1.5"><Users className="h-3.5 w-3.5" />{isLoading ? '…' : employees.length}</Badge>
                </div>

                {isLoading ? (
                  <div className="grid min-h-40 place-items-center border-y">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : employees.length ? (
                  <div className="divide-y border-y">
                    {employees.map(employee => {
                      const name = [employee.firstName, employee.lastName].filter(Boolean).join(' ') || employee.email || 'Unnamed employee';
                      const assignedUnit = employee.departmentId ? unitById.get(employee.departmentId) : null;
                      return (
                        <article key={employee.id} className="flex gap-3 py-4">
                          <Avatar size="md" className="rounded-md">
                            {employee.employeeAvatarUrl && <AvatarImage src={employee.employeeAvatarUrl} alt="" />}
                            <AvatarFallback className="rounded-md text-xs font-semibold">{initials(name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold">{name}</p>
                              {employee.status && <Badge variant="outline" className="capitalize">{employee.status.replaceAll('_', ' ')}</Badge>}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BriefcaseBusiness className="h-3.5 w-3.5" />
                              {employee.positionTitle || employee.jobTitle || 'Position not assigned'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                              {employee.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{employee.email}</span>}
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{assignedUnit?.name || unit.name}</span>
                              {employee.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{employee.location}</span>}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-40 place-items-center border-y px-6 text-center">
                    <div>
                      <Users className="mx-auto h-7 w-7 text-muted-foreground/50" />
                      <p className="mt-2 text-sm font-medium">No employees assigned</p>
                      <p className="mt-1 text-xs text-muted-foreground">Employees assigned to this unit or its child units will appear here.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}

function getDescendantIds(rootId: string, units: DepartmentUnit[]) {
  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of units) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        changed = true;
      }
    }
  }
  return ids;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
