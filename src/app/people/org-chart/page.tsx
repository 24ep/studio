"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import {
  OrgChartEditDialog,
  type OrgChartEditTarget,
} from '@/components/people/OrgChartEditDialog';
import { OrgChartFocusWorkspace } from '@/components/people/OrgChartFocusWorkspace';
import {
  normalizeDepartmentUnit,
  type DepartmentUnit,
} from '@/components/people/department-hierarchy-utils';
import { hasPermission } from '@/lib/permissions';
import { OrgChartPositionCanvas } from './OrgChartPositionCanvas';
import {
  buildFallbackPositions,
  employeePositionId,
  employeePositionTitle,
  type EmployeeNode,
  type PositionNode,
} from './org-chart-page-model';

type OrgView = 'position' | 'employee';

export default function PeopleOrgChartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canManagePeople = hasPermission(session?.user, 'HR_PEOPLE_MANAGE');
  const [view, setView] = React.useState<OrgView>('employee');
  const [employees, setEmployees] = React.useState<EmployeeNode[]>([]);
  const [positions, setPositions] = React.useState<PositionNode[]>([]);
  const [units, setUnits] = React.useState<DepartmentUnit[]>([]);
  const [editTarget, setEditTarget] = React.useState<OrgChartEditTarget | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadChartData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [employeesResponse, positionsResponse, departmentsResponse] = await Promise.all([
        fetch('/api/hr/employees', { credentials: 'include' }),
        fetch('/api/positions?limit=200&includeHeadcount=true', { credentials: 'include' }).catch(() => null),
        fetch('/api/hr/departments', { credentials: 'include' }).catch(() => null),
      ]);

      if (employeesResponse.status === 401) {
        router.replace('/auth/signin?callbackUrl=%2Fpeople%2Forg-chart');
        return;
      }
      if (employeesResponse.status === 403) {
        throw new Error('You do not have permission to view the organization chart.');
      }
      if (!employeesResponse.ok) {
        const payload = await employeesResponse.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message || 'Unable to load organization chart data.');
      }

      const employeesPayload = await employeesResponse.json() as { resource?: { records?: EmployeeNode[] } };
      const nextEmployees = employeesPayload.resource?.records || [];
      setEmployees(nextEmployees);

      if (positionsResponse?.ok) {
        const positionsPayload = await positionsResponse.json() as { data?: PositionNode[] };
        setPositions(positionsPayload.data || []);
      } else {
        setPositions([]);
      }

      if (departmentsResponse?.ok) {
        const departmentsPayload = await departmentsResponse.json() as {
          resource?: { records?: Array<Record<string, unknown> & { id: string }> };
        };
        setUnits((departmentsPayload.resource?.records || []).map(normalizeDepartmentUnit));
      } else {
        setUnits([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load org chart.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    void loadChartData();
  }, [loadChartData]);

  const positionNodes = positions.length > 0 ? positions : buildFallbackPositions(employees);
  const employeesByPosition = React.useMemo(() => employees.reduce<Record<string, EmployeeNode[]>>((groups, employee) => {
    const key = employeePositionId(employee) || `position:${employeePositionTitle(employee)}`;
    groups[key] = [...(groups[key] || []), employee];
    return groups;
  }, {}), [employees]);

  return (
    <main className="flex min-h-full flex-col overflow-hidden text-foreground">
      {view === 'position' && (
        <div className="flex shrink-0 flex-col gap-4 border-b border-border bg-card px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Organization Chart</h1>
            <p className="mt-1 text-sm text-muted-foreground">Explore positions, headcount, and organization units.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-[8px] border border-border bg-muted p-1">
              <button
                type="button"
                className="rounded-[6px] px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setView('employee')}
              >
                Employee
              </button>
              <button
                type="button"
                className="rounded-[6px] bg-card px-3 py-1.5 text-sm font-semibold text-primary shadow-sm dark:shadow-none"
                onClick={() => setView('position')}
              >
                Position
              </button>
            </div>
            <Button asChild className="h-10 gap-2">
              <Link href="/people"><UserPlusIcon className="h-4 w-4" />Add person</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto bg-background p-4 sm:p-5 lg:p-6">
        {isLoading ? (
          <CanvasLoading />
        ) : error ? (
          <div role="alert" className="rounded-[8px] border border-red-100 bg-red-50 p-5 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
            <p className="text-sm font-semibold">Organization chart unavailable</p>
            <p className="mt-1 text-sm font-normal">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadChartData()}>
              Try again
            </Button>
          </div>
        ) : employees.length === 0 ? (
          <EmptyOrgChart />
        ) : view === 'position' ? (
          <OrgChartPositionCanvas
            positions={positionNodes}
            employeesByPosition={employeesByPosition}
            units={units}
            canManagePeople={canManagePeople}
            onEditPosition={position => setEditTarget({ type: 'position', position })}
            onEditDivision={name => {
              const unit = units.find(item => item.unitType === 'division' && item.name === name);
              if (unit) setEditTarget({
                type: 'division',
                id: unit.id,
                name,
                headcountAllocation: unit.headcountAllocation,
                headcountUsage: unit.headcountUsage,
              });
            }}
            onEditDepartment={(division, name) => {
              const unit = units.find(item => item.unitType === 'department' && item.division === division && item.name === name);
              if (unit) setEditTarget({
                type: 'department',
                id: unit.id,
                division,
                name,
                headcountAllocation: unit.headcountAllocation,
                headcountUsage: unit.headcountUsage,
              });
            }}
          />
        ) : (
          <OrgChartFocusWorkspace
            employees={employees}
            units={units}
            canManage={canManagePeople}
            onPositionView={() => setView('position')}
            onManagerChanged={loadChartData}
          />
        )}
      </div>

      <OrgChartEditDialog
        target={editTarget}
        employees={employees}
        units={units}
        onOpenChange={open => !open && setEditTarget(null)}
        onSaved={loadChartData}
      />
    </main>
  );
}

function CanvasLoading() {
  return (
    <div className="grid min-w-[900px] gap-5 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-[8px] bg-card shadow-sm ring-1 ring-border dark:shadow-none" />
      ))}
    </div>
  );
}

function EmptyOrgChart() {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[8px] bg-muted text-muted-foreground">
        <UsersIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-sm font-bold text-card-foreground">No employees to chart</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add employees and manager assignments to see the reporting structure.</p>
    </div>
  );
}
