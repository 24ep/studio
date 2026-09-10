import type { EssDashboard } from './ess-types';

const employee: EssDashboard['employee'] = {
  id: 'preview-employee',
  name: 'Riya Patel',
  legalName: 'Riya Patel',
  preferredName: 'Riya',
  employeeNumber: 'EMP-1042',
  email: 'riya.patel@example.com',
  phone: null,
  workPhone: null,
  jobTitle: 'Product Designer',
  department: 'Design',
  businessUnit: 'Product',
  managerName: 'Aarav Sharma',
  employmentType: 'Full time',
  status: 'active',
  hireDate: '2023-02-06',
  location: 'Bangkok',
  profilePhotoUrl: null,
  profileCompletion: 96,
  profile: {},
  sensitive: {},
  fieldPermissions: {},
};

function dateAt(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-CA');
}

function timeAt(date: string, hours: number, minutes: number) {
  return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+07:00`).toISOString();
}

const history = [
  { offset: -6, start: [9, 2], end: [17, 44], hours: 7.95, status: 'present', location: 'office' },
  { offset: -5, start: [8, 54], end: [18, 3], hours: 8.42, status: 'present', location: 'office' },
  { offset: -4, start: [9, 18], end: [17, 51], hours: 7.8, status: 'late', location: 'remote' },
  { offset: -3, start: [8, 58], end: [17, 39], hours: 7.93, status: 'present', location: 'office' },
  { offset: -2, start: [9, 1], end: [18, 12], hours: 8.43, status: 'present', location: 'office' },
] as const;

export const essAttendancePreviewData: EssDashboard = {
  employee,
  metrics: { openLeaveRequests: 1, pendingDocuments: 0, activeLearning: 2, latestOnboardingProgress: 100, directReports: 0 },
  attendance: history.map((item, index) => {
    const date = dateAt(item.offset);
    return {
      id: `attendance-${index}`,
      work_date: date,
      clock_in: timeAt(date, item.start[0], item.start[1]),
      clock_out: timeAt(date, item.end[0], item.end[1]),
      hours_worked: item.hours,
      break_minutes: 45,
      status: item.status,
      work_location: item.location,
    };
  }).reverse(),
  shifts: [0, 1, 2, 3].map(offset => ({
    id: `shift-${offset}`,
    shift_date: dateAt(offset),
    start_time: '09:00',
    end_time: '18:00',
    schedule_name: offset === 1 ? 'Remote focus day' : 'Product design · Bangkok',
    status: 'scheduled',
  })),
  documents: [],
  leaveBalances: [],
  leaveRequests: [],
  payslips: [],
  learning: [],
  performance: [],
  goals: [],
  profileRequests: [],
  requests: [],
};
