export type EssView =
  | 'profile'
  | 'leave'
  | 'attendance'
  | 'shift-requests'
  | 'attendance-corrections'
  | 'overtime'
  | 'timesheet'
  | 'documents'
  | 'performance'
  | 'team';

export type EssRow = Record<string, unknown> & {
  id?: string;
  status?: string;
  version?: number;
};

export type EssEmployee = {
  id: string;
  name: string;
  legalName: string;
  preferredName: string | null;
  employeeNumber: string;
  email: string;
  phone: string | null;
  workPhone: string | null;
  jobTitle: string | null;
  department: string | null;
  businessUnit: string | null;
  managerName: string | null;
  employmentType: string;
  status: string;
  hireDate: string | null;
  location: string | null;
  profilePhotoUrl: string | null;
  profileCompletion: number;
  profile: Record<string, unknown>;
  sensitive: Record<string, Record<string, unknown>>;
  fieldPermissions: Record<string, string>;
};

export type EssDashboard = {
  employee: EssEmployee;
  metrics: {
    openLeaveRequests: number;
    pendingDocuments: number;
    activeLearning: number;
    latestOnboardingProgress: number;
    directReports: number;
  };
  documents: EssRow[];
  leaveBalances: EssRow[];
  leaveRequests: EssRow[];
  attendance: EssRow[];
  shifts: EssRow[];
  payslips: EssRow[];
  learning: EssRow[];
  performance: EssRow[];
  goals: EssRow[];
  profileRequests: EssRow[];
  requests: EssRow[];
};

export type TeamDashboard = {
  reports: EssRow[];
  pendingLeave: EssRow[];
  attendanceExceptions: EssRow[];
  onboardingFollowUp: EssRow[];
  availability?: EssRow[];
  metrics: {
    directReports: number;
    pendingLeave: number;
    attendanceExceptions: number;
    onboardingFollowUp: number;
  };
};

export function stringValue(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function dateValue(value: unknown, fallback = 'Not set') {
  if (!value) return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function timeValue(value: unknown, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function statusLabel(value: unknown) {
  return stringValue(value, 'pending').replace(/_/g, ' ');
}

export function personName(row: EssRow) {
  return [row.preferred_name || row.first_name, row.last_name].filter(Boolean).join(' ') || stringValue(row.name, 'Employee');
}
