import type { HrCrudRecord } from '@/lib/hr/hr-crud';

export type EmployeeNode = HrCrudRecord & {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  managerId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  position_id?: string | null;
  positionTitle?: string | null;
  position?: { id?: string; title?: string; department?: string } | null;
  department?: string | null;
  location?: string | null;
};

export type PositionNode = Record<string, unknown> & {
  id: string;
  title?: string | null;
  department?: string | null;
  isOpen?: boolean | null;
  positionLevel?: string | null;
  organizationUnitId?: string | null;
  headcountData?: {
    total?: number;
    vacant?: number;
    filled?: number;
  };
};

export function text(value: unknown, fallback = 'Not set') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function employeeName(employee: EmployeeNode) {
  return `${text(employee.firstName, '')} ${text(employee.lastName, '')}`.trim() || text(employee.email, 'Unnamed employee');
}

export function employeePositionId(employee: EmployeeNode) {
  return employee.positionId || employee.position_id || employee.position?.id || '';
}

export function employeePositionTitle(employee: EmployeeNode) {
  return employee.positionTitle || employee.position?.title || employee.jobTitle || 'Unassigned position';
}

export function buildFallbackPositions(employees: EmployeeNode[]) {
  const groups = new Map<string, PositionNode>();
  for (const employee of employees) {
    const id = employeePositionId(employee) || `position:${employeePositionTitle(employee)}`;
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        title: employeePositionTitle(employee),
        department: employee.department || employee.position?.department || employee.location || 'People',
        isOpen: true,
      });
    }
  }
  return Array.from(groups.values());
}

export function getPositionHeadcount(position: PositionNode, employees: EmployeeNode[]) {
  const headcount = position.headcountData;
  const total = headcount?.total ?? Math.max(employees.length, 1);
  const filled = headcount?.filled ?? employees.length;
  const vacant = headcount?.vacant ?? Math.max(total - filled, 0);
  return { total, filled, vacant };
}
