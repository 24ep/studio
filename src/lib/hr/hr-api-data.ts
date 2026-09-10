import prisma from '@/lib/prisma';
import { calculateAverageProgress, calculateLeaveRemaining, calculatePayrollTotals } from './hr-calculations';
import type { HrModuleKey } from './hr-module-config';

export interface HrMetric {
  label: string;
  value: string;
  helper: string;
}

export interface HrRecord {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  meta: string;
}

export interface HrModuleData {
  metrics: HrMetric[];
  records: HrRecord[];
  emptyTitle: string;
  emptyDescription: string;
}

type CountRow = { count: bigint | number | string };
type EmployeeRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  status: string;
  department_name: string | null;
};

function toNumber(value: unknown) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'THB',
  }).format(value);
}

async function safeQuery<T>(query: string) {
  try {
    return await prisma.$queryRawUnsafe<T[]>(query);
  } catch (error) {
    console.warn('[HR API] Falling back because HR table query failed:', error);
    return [];
  }
}

async function countFrom(query: string) {
  const rows = await safeQuery<CountRow>(query);
  return toNumber(rows[0]?.count);
}

async function getPeopleData(): Promise<HrModuleData> {
  const [employees, activeEmployees, departments, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_employees'),
    countFrom("SELECT COUNT(*) AS count FROM hr_employees WHERE status = 'active'"),
    countFrom("SELECT COUNT(*) AS count FROM hr_departments WHERE is_active = true"),
    safeQuery<EmployeeRow>(`
      SELECT e.id, e.first_name, e.last_name, e.email, e.job_title, e.status, d.name AS department_name
      FROM hr_employees e
      LEFT JOIN hr_departments d ON d.id = e.department_id
      ORDER BY e.updated_at DESC
      LIMIT 8
    `),
  ]);

  const records = rows.map((employee) => ({
    id: employee.id,
    title: `${employee.first_name} ${employee.last_name}`,
    subtitle: employee.job_title || employee.email,
    status: employee.status,
    meta: employee.department_name || 'No department',
  }));

  return {
    metrics: [
      { label: 'Employees', value: formatNumber(employees), helper: 'Total HR employee records' },
      { label: 'Active', value: formatNumber(activeEmployees), helper: 'Employees currently active' },
      { label: 'Departments', value: formatNumber(departments), helper: 'Active departments' },
    ],
    records,
    emptyTitle: 'No employee records yet',
    emptyDescription: 'Create employees or sync users into HR records to activate the people module.',
  };
}

async function getClientsData(): Promise<HrModuleData> {
  const [clients, activeClients, assignedEmployees, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_clients'),
    countFrom("SELECT COUNT(*) AS count FROM hr_clients WHERE status = 'active'"),
    countFrom('SELECT COUNT(*) AS count FROM hr_employees WHERE client_id IS NOT NULL'),
    safeQuery<{
      id: string;
      client_code: string;
      name: string;
      industry: string | null;
      status: string;
      employee_count: number | string;
    }>(`
      SELECT c.id, c.client_code, c.name, c.industry, c.status, COUNT(e.id)::int AS employee_count
      FROM hr_clients c
      LEFT JOIN hr_employees e ON e.client_id = c.id
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Clients', value: formatNumber(clients), helper: 'Registered customer organizations' },
      { label: 'Active', value: formatNumber(activeClients), helper: 'Available for employee assignment' },
      { label: 'Assigned employees', value: formatNumber(assignedEmployees), helper: 'Employees working for a client' },
    ],
    records: rows.map(row => ({
      id: row.id,
      title: row.name,
      subtitle: row.industry || 'Industry not set',
      status: row.status,
      meta: `${formatNumber(toNumber(row.employee_count))} employee${toNumber(row.employee_count) === 1 ? '' : 's'}`,
    })),
    emptyTitle: 'No clients yet',
    emptyDescription: 'Add a client before assigning subcontract employees.',
  };
}

async function getOnboardingData(): Promise<HrModuleData> {
  const [cases, activeCases, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_employee_onboarding'),
    countFrom("SELECT COUNT(*) AS count FROM hr_employee_onboarding WHERE status IN ('not_started', 'in_progress')"),
    safeQuery<{ id: string; status: string; progress: number; first_name: string; last_name: string; target_date: Date | null }>(`
      SELECT o.id, o.status, o.progress, e.first_name, e.last_name, o.target_date
      FROM hr_employee_onboarding o
      LEFT JOIN hr_employees e ON e.id = o.employee_id
      ORDER BY o.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Cases', value: formatNumber(cases), helper: 'Employee onboarding records' },
      { label: 'Active', value: formatNumber(activeCases), helper: 'Not started or in progress' },
      { label: 'Avg progress', value: `${calculateAverageProgress(rows.map(row => row.progress))}%`, helper: 'Across visible onboarding cases' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: `${row.first_name || 'New'} ${row.last_name || 'hire'}`,
      subtitle: `Progress ${row.progress}%`,
      status: row.status,
      meta: row.target_date ? `Target ${new Date(row.target_date).toLocaleDateString()}` : 'No target date',
    })),
    emptyTitle: 'No onboarding cases yet',
    emptyDescription: 'Create an onboarding case when an applicant is hired or an employee joins.',
  };
}

async function getDocumentsData(): Promise<HrModuleData> {
  const [documents, pendingAcknowledgments, acknowledged, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_employee_documents'),
    countFrom('SELECT COUNT(*) AS count FROM hr_employee_documents WHERE requires_acknowledgment = true AND acknowledged_at IS NULL'),
    countFrom('SELECT COUNT(*) AS count FROM hr_employee_documents WHERE requires_acknowledgment = true AND acknowledged_at IS NOT NULL'),
    safeQuery<{ id: string; title: string; type: string; status: string; first_name: string; last_name: string; requires_acknowledgment: boolean; acknowledged_at: Date | null }>(`
      SELECT doc.id, doc.title, doc.type, doc.status, e.first_name, e.last_name,
             doc.requires_acknowledgment, doc.acknowledged_at
      FROM hr_employee_documents doc
      LEFT JOIN hr_employees e ON e.id = doc.employee_id
      ORDER BY doc.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Documents', value: formatNumber(documents), helper: 'Registered employee documents' },
      { label: 'Awaiting acknowledgment', value: formatNumber(pendingAcknowledgments), helper: 'Required acknowledgments not yet received' },
      { label: 'Acknowledged', value: formatNumber(acknowledged), helper: 'Tracked employee acknowledgments' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      status: row.status,
      meta: row.requires_acknowledgment
        ? row.acknowledged_at
          ? `Acknowledged ${new Date(row.acknowledged_at).toLocaleDateString()}`
          : 'Acknowledgment required'
        : row.type,
    })),
    emptyTitle: 'No documents yet',
    emptyDescription: 'Use this register for contracts, ID files, policies, and expiring certifications.',
  };
}

async function getDepartmentsData(): Promise<HrModuleData> {
  const [departments, active, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_departments'),
    countFrom('SELECT COUNT(*) AS count FROM hr_departments WHERE is_active = true'),
    safeQuery<{
      id: string;
      name: string;
      code: string | null;
      division: string | null;
      department: string | null;
      section: string | null;
      description: string | null;
      is_active: boolean;
    }>(`
      SELECT id, name, code, division, department, section, description, is_active
      FROM hr_departments
      ORDER BY name ASC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Departments', value: formatNumber(departments), helper: 'HR organization units' },
      { label: 'Active', value: formatNumber(active), helper: 'Visible in HR workflows' },
      { label: 'Inactive', value: formatNumber(Math.max(0, departments - active)), helper: 'Hidden or archived' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: row.name,
      subtitle: [row.division, row.department, row.section].filter(Boolean).join(' / ') || row.description || row.code || 'Department',
      status: row.is_active ? 'active' : 'inactive',
      meta: row.code || 'No code',
    })),
    emptyTitle: 'No departments yet',
    emptyDescription: 'Create departments to organize employee records, permissions, and reporting.',
  };
}

async function getAttendanceData(): Promise<HrModuleData> {
  const [records, present, hours, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_attendance_records'),
    countFrom("SELECT COUNT(*) AS count FROM hr_attendance_records WHERE status = 'present'"),
    safeQuery<{ total: number | string | null }>('SELECT COALESCE(SUM(hours_worked), 0) AS total FROM hr_attendance_records'),
    safeQuery<{ id: string; work_date: Date; status: string; hours_worked: number; first_name: string; last_name: string }>(`
      SELECT a.id, a.work_date, a.status, a.hours_worked, e.first_name, e.last_name
      FROM hr_attendance_records a
      LEFT JOIN hr_employees e ON e.id = a.employee_id
      ORDER BY a.work_date DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Records', value: formatNumber(records), helper: 'Attendance entries' },
      { label: 'Present', value: formatNumber(present), helper: 'Present records' },
      { label: 'Hours', value: formatNumber(toNumber(hours[0]?.total)), helper: 'Total recorded hours' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      subtitle: `${row.hours_worked} hours`,
      status: row.status,
      meta: new Date(row.work_date).toLocaleDateString(),
    })),
    emptyTitle: 'No attendance records yet',
    emptyDescription: 'Attendance entries will appear here once time capture or imports are connected.',
  };
}

async function getLeaveData(): Promise<HrModuleData> {
  const [requests, pending, balances, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_leave_requests'),
    countFrom("SELECT COUNT(*) AS count FROM hr_leave_requests WHERE status = 'pending'"),
    safeQuery<{ allocated: number; accrued: number; used: number; pending: number; reserved: number; carryForward: number }>(
      'SELECT allocated, accrued, used, pending, reserved, carry_forward AS "carryForward" FROM hr_leave_balances',
    ),
    safeQuery<{ id: string; start_date: Date; end_date: Date; days: number; status: string; first_name: string; last_name: string }>(`
      SELECT lr.id, lr.start_date, lr.end_date, lr.days, lr.status, e.first_name, e.last_name
      FROM hr_leave_requests lr
      LEFT JOIN hr_employees e ON e.id = lr.employee_id
      ORDER BY lr.start_date DESC
      LIMIT 8
    `),
  ]);

  const remaining = balances.reduce((sum, balance) => sum + calculateLeaveRemaining(balance), 0);
  return {
    metrics: [
      { label: 'Requests', value: formatNumber(requests), helper: 'Leave requests' },
      { label: 'Pending', value: formatNumber(pending), helper: 'Waiting for approval' },
      { label: 'Remaining', value: formatNumber(remaining), helper: 'Available leave days' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      subtitle: `${row.days} day${row.days === 1 ? '' : 's'}`,
      status: row.status,
      meta: `${new Date(row.start_date).toLocaleDateString()} - ${new Date(row.end_date).toLocaleDateString()}`,
    })),
    emptyTitle: 'No leave requests yet',
    emptyDescription: 'Approved, rejected, and pending leave requests will be tracked here.',
  };
}

async function getPerformanceData(): Promise<HrModuleData> {
  const [reviews, complete, goals, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_performance_reviews'),
    countFrom("SELECT COUNT(*) AS count FROM hr_performance_reviews WHERE status = 'completed'"),
    countFrom("SELECT COUNT(*) AS count FROM hr_performance_goals WHERE status = 'active'"),
    safeQuery<{ id: string; status: string; rating: number | null; first_name: string; last_name: string }>(`
      SELECT pr.id, pr.status, pr.rating, e.first_name, e.last_name
      FROM hr_performance_reviews pr
      LEFT JOIN hr_employees e ON e.id = pr.employee_id
      ORDER BY pr.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Reviews', value: formatNumber(reviews), helper: 'Performance review records' },
      { label: 'Completed', value: formatNumber(complete), helper: 'Finished reviews' },
      { label: 'Goals', value: formatNumber(goals), helper: 'Active employee goals' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      subtitle: row.rating === null ? 'No rating yet' : `Rating ${row.rating}`,
      status: row.status,
      meta: 'Performance review',
    })),
    emptyTitle: 'No performance reviews yet',
    emptyDescription: 'Create cycles, reviews, and goals to manage employee performance.',
  };
}

async function getLearningData(): Promise<HrModuleData> {
  const [courses, enrollments, complete, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_learning_courses WHERE is_active = true'),
    countFrom('SELECT COUNT(*) AS count FROM hr_learning_enrollments'),
    countFrom("SELECT COUNT(*) AS count FROM hr_learning_enrollments WHERE status = 'completed'"),
    safeQuery<{ id: string; status: string; progress: number; title: string; first_name: string; last_name: string }>(`
      SELECT le.id, le.status, le.progress, c.title, e.first_name, e.last_name
      FROM hr_learning_enrollments le
      LEFT JOIN hr_learning_courses c ON c.id = le.course_id
      LEFT JOIN hr_employees e ON e.id = le.employee_id
      ORDER BY le.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Courses', value: formatNumber(courses), helper: 'Active learning courses' },
      { label: 'Enrollments', value: formatNumber(enrollments), helper: 'Assigned learning records' },
      { label: 'Completed', value: formatNumber(complete), helper: 'Completed enrollments' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: row.title || 'Learning course',
      subtitle: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      status: row.status,
      meta: `${row.progress}%`,
    })),
    emptyTitle: 'No learning enrollments yet',
    emptyDescription: 'Assign courses to employees to track training and certification progress.',
  };
}

async function getPayrollData(view?: string | null): Promise<HrModuleData> {
  const [runs, processed, items, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_payroll_runs'),
    countFrom("SELECT COUNT(*) AS count FROM hr_payroll_runs WHERE status = 'processed'"),
    safeQuery<{ gross_pay: string | number; net_pay: string | number; adjustments: string | number }>('SELECT gross_pay, net_pay, adjustments FROM hr_payroll_run_items'),
    safeQuery<{ id: string; name: string | null; status: string; gross_total: string | number; net_total: string | number; pay_date: Date | null }>(`
      SELECT pr.id, pp.name, pr.status, pr.gross_total, pr.net_total, pp.pay_date
      FROM hr_payroll_runs pr
      LEFT JOIN hr_payroll_periods pp ON pp.id = pr.period_id
      ORDER BY pr.updated_at DESC
      LIMIT 8
    `),
  ]);
  const totals = calculatePayrollTotals(items.map((item) => ({
    grossPay: toNumber(item.gross_pay),
    netPay: toNumber(item.net_pay),
    adjustments: toNumber(item.adjustments),
  })));

  if (view === 'payslips') return getPayslipsData();
  if (view === 'compensation') return getCompensationData();
  if (view === 'reports') {
    return {
      metrics: [
        { label: 'Runs', value: formatNumber(runs), helper: 'Payroll runs' },
        { label: 'Processed', value: formatNumber(processed), helper: 'Completed payroll runs' },
        { label: 'Net total', value: formatMoney(totals.netPay), helper: 'Net total from run items' },
      ],
      records: rows.map(row => ({
        id: row.id,
        title: row.name || 'Payroll period',
        subtitle: `Gross ${formatMoney(toNumber(row.gross_total))}`,
        status: row.status,
        meta: `Net ${formatMoney(toNumber(row.net_total))}`,
      })),
      emptyTitle: 'No payroll reports yet',
      emptyDescription: 'Payroll report lines will appear after payroll periods and runs are created.',
    };
  }

  return {
    metrics: [
      { label: 'Runs', value: formatNumber(runs), helper: 'Payroll run records' },
      { label: 'Processed', value: formatNumber(processed), helper: 'Processed runs' },
      { label: 'Net total', value: formatMoney(totals.netPay), helper: 'Net pay across items' },
    ],
    records: rows.map((row) => ({
      id: row.id,
      title: row.name || 'Payroll run',
      subtitle: `Gross ${formatMoney(toNumber(row.gross_total))}`,
      status: row.status,
      meta: row.pay_date ? `Pay date ${new Date(row.pay_date).toLocaleDateString()}` : `Net ${formatMoney(toNumber(row.net_total))}`,
    })),
    emptyTitle: 'No payroll runs yet',
    emptyDescription: 'Payroll V1 stores payroll periods, run totals, items, and payslip publication state.',
  };
}

async function getPayslipsData(): Promise<HrModuleData> {
  const [payslips, published, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_payslips'),
    countFrom("SELECT COUNT(*) AS count FROM hr_payslips WHERE status = 'published'"),
    safeQuery<{ id: string; status: string; first_name: string; last_name: string; published_at: Date | null }>(`
      SELECT p.id, p.status, e.first_name, e.last_name, p.published_at
      FROM hr_payslips p
      LEFT JOIN hr_employees e ON e.id = p.employee_id
      ORDER BY p.updated_at DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Payslips', value: formatNumber(payslips), helper: 'Payslip records' },
      { label: 'Published', value: formatNumber(published), helper: 'Visible to employees' },
      { label: 'Draft', value: formatNumber(Math.max(0, payslips - published)), helper: 'Not yet published' },
    ],
    records: rows.map(row => ({
      id: row.id,
      title: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      subtitle: row.published_at ? `Published ${new Date(row.published_at).toLocaleDateString()}` : 'Not published',
      status: row.status,
      meta: 'Payslip',
    })),
    emptyTitle: 'No payslips yet',
    emptyDescription: 'Payslips will appear once payroll run items are generated.',
  };
}

async function getCompensationData(): Promise<HrModuleData> {
  const [packages, monthly, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_compensation_packages'),
    countFrom("SELECT COUNT(*) AS count FROM hr_compensation_packages WHERE pay_frequency = 'monthly'"),
    safeQuery<{ id: string; base_salary: string | number; currency: string; pay_frequency: string; first_name: string; last_name: string }>(`
      SELECT cp.id, cp.base_salary, cp.currency, cp.pay_frequency, e.first_name, e.last_name
      FROM hr_compensation_packages cp
      LEFT JOIN hr_employees e ON e.id = cp.employee_id
      ORDER BY cp.effective_from DESC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Packages', value: formatNumber(packages), helper: 'Compensation packages' },
      { label: 'Monthly', value: formatNumber(monthly), helper: 'Monthly pay frequency' },
      { label: 'Annualized', value: formatMoney(rows.reduce((sum, row) => sum + toNumber(row.base_salary) * 12, 0)), helper: 'Visible row annualized salary' },
    ],
    records: rows.map(row => ({
      id: row.id,
      title: `${row.first_name || 'Employee'} ${row.last_name || ''}`.trim(),
      subtitle: `${row.currency} ${formatNumber(toNumber(row.base_salary))}`,
      status: row.pay_frequency,
      meta: 'Compensation',
    })),
    emptyTitle: 'No compensation packages yet',
    emptyDescription: 'Add base salary and pay frequency records for payroll planning.',
  };
}

async function getBenefitsData(): Promise<HrModuleData> {
  const [plans, activeEnrollments, rows] = await Promise.all([
    countFrom('SELECT COUNT(*) AS count FROM hr_benefit_plans'),
    countFrom("SELECT COUNT(*) AS count FROM hr_employee_benefit_enrollments WHERE status = 'active'"),
    safeQuery<{ id: string; name: string; type: string; is_active: boolean; employer_cost: string | number; employee_cost: string | number }>(`
      SELECT id, name, type, is_active, employer_cost, employee_cost
      FROM hr_benefit_plans
      ORDER BY name ASC
      LIMIT 8
    `),
  ]);

  return {
    metrics: [
      { label: 'Plans', value: formatNumber(plans), helper: 'Benefit plans' },
      { label: 'Enrollments', value: formatNumber(activeEnrollments), helper: 'Active employee enrollments' },
      { label: 'Plan cost', value: formatMoney(rows.reduce((sum, row) => sum + toNumber(row.employer_cost) + toNumber(row.employee_cost), 0)), helper: 'Visible row monthly cost' },
    ],
    records: rows.map(row => ({
      id: row.id,
      title: row.name,
      subtitle: `${formatMoney(toNumber(row.employer_cost))} employer`,
      status: row.is_active ? 'active' : 'inactive',
      meta: row.type,
    })),
    emptyTitle: 'No benefit plans yet',
    emptyDescription: 'Create benefit plans and employee enrollments for payroll and total rewards.',
  };
}

export async function getHrModuleData(key: HrModuleKey, view?: string | null) {
  switch (key) {
    case 'clients':
      return getClientsData();
    case 'people':
      return getPeopleData();
    case 'onboarding':
      return getOnboardingData();
    case 'documents':
      return getDocumentsData();
    case 'teams':
      return getDepartmentsData();
    case 'attendance':
      return getAttendanceData();
    case 'leave':
      return getLeaveData();
    case 'performance':
      return getPerformanceData();
    case 'learning':
      return getLearningData();
    case 'payroll':
    case 'payroll-runs':
    case 'payslips':
    case 'compensation':
    case 'payroll-reports':
      return getPayrollData(view || key.replace('payroll-', ''));
    case 'benefits':
      return getBenefitsData();
  }
}
