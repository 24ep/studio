import type { DepartmentUnit } from './department-hierarchy-utils';

export interface OrgChartFocusEmployee {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  status?: string | null;
  location?: string | null;
  managerId?: string | null;
  departmentId?: string | null;
  department?: string | null;
  positionTitle?: string | null;
  position?: { title?: string; department?: string } | null;
}

export type InspectorTab = 'overview' | 'reporting' | 'position';

export type PendingManagerChange = {
  employee: OrgChartFocusEmployee;
  previousManager: OrgChartFocusEmployee | null;
  newManager: OrgChartFocusEmployee;
};

export function employeeName(employee: OrgChartFocusEmployee) {
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ').trim()
    || employee.email
    || 'Unnamed employee';
}

export function employeeRole(employee: OrgChartFocusEmployee) {
  return employee.positionTitle || employee.position?.title || employee.jobTitle || 'Role not set';
}

export function initials(employee: OrgChartFocusEmployee) {
  return employeeName(employee)
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function departmentName(employee: OrgChartFocusEmployee, units: DepartmentUnit[]) {
  const unit = units.find(item => item.id === employee.departmentId);
  return unit?.department || employee.department || employee.position?.department || 'Unassigned department';
}

export function defaultFocusEmployeeId(employees: OrgChartFocusEmployee[]) {
  const reportCount = (id: string) => employees.filter(employee => employee.managerId === id).length;
  return [...employees]
    .filter(employee => employee.managerId && reportCount(employee.id) > 0)
    .sort((a, b) => reportCount(b.id) - reportCount(a.id))[0]?.id
    || employees.find(employee => employee.managerId)?.id
    || employees[0]?.id
    || null;
}
