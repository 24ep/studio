type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

export function timeMutationEmployeeIds(value: unknown): string[] {
  const ids = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const item = record(node);
    if (!item) return;
    for (const key of ['employee_id', 'employeeId']) {
      if (typeof item[key] === 'string' && item[key]) ids.add(String(item[key]));
    }
    for (const key of ['employeeIds', 'assignments', 'records', 'data']) {
      if (item[key] !== undefined) visit(item[key]);
    }
  };
  visit(value);
  return [...ids];
}

export function timeNotificationHref(action: string, employeeSelfService = true) {
  if (action.includes('timesheet')) return employeeSelfService ? '/ess/timesheet' : '/workforce/attendance?view=timesheet';
  if (action.includes('overtime')) return employeeSelfService ? '/ess/overtime' : '/workforce/attendance?view=overtime';
  if (action.includes('shift_request')) return employeeSelfService ? '/ess/shift-requests' : '/workforce/leave?type=shift-request';
  if (action === 'publish_roster' || action === 'copy_roster') return employeeSelfService ? '/ess/attendance' : '/workforce/attendance?view=roster';
  return employeeSelfService ? '/ess/attendance' : '/workforce/attendance';
}
