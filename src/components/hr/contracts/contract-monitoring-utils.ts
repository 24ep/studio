import { DAY_MS, getContractExpiry } from '@/lib/hr/contract-monitoring';
import type { ContractDocument, ContractEmployee, ContractEmployeeWithExpiry } from './contract-monitoring-types';

export const CONTRACT_REFERENCE_DATE = new Date('2026-08-11T12:00:00.000Z');

export const previewContractEmployees: ContractEmployee[] = [
  { id: 'preview-1', employeeNumber: 'EMP-10234', firstName: 'Jamie', lastName: 'Wilson', email: 'jamie.wilson@hrive.com', jobTitle: 'Payroll Analyst', employmentType: 'contractor', clientName: 'ABC Solutions', departmentName: 'Finance', location: 'Austin, TX', managerName: 'Morgan Harper', hireDate: '2026-02-18', endDate: '2026-08-17', contractNoticeDays: 15, status: 'active' },
  { id: 'preview-2', employeeNumber: 'EMP-10456', firstName: 'Sam', lastName: 'Patel', email: 'sam.patel@hrive.com', jobTitle: 'Systems Specialist', employmentType: 'contractor', clientName: 'Northstar Group', departmentName: 'IT', location: 'Denver, CO', managerName: 'Morgan Harper', hireDate: '2026-01-12', endDate: '2026-08-28', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-3', employeeNumber: 'EMP-10789', firstName: 'Maria', lastName: 'Lopez', email: 'maria.lopez@hrive.com', jobTitle: 'Product Designer', employmentType: 'subcontract', clientName: 'DesignHub LLC', departmentName: 'Product', location: 'Chicago, IL', managerName: 'Aisha Carter', hireDate: '2025-10-01', endDate: '2026-07-30', contractNoticeDays: 15, status: 'active' },
  { id: 'preview-4', employeeNumber: 'EMP-11023', firstName: 'David', lastName: 'Kim', email: 'david.kim@hrive.com', jobTitle: 'Software Engineer', employmentType: 'contractor', clientName: 'GlobalSoft', departmentName: 'Engineering', location: 'Seattle, WA', managerName: 'Morgan Harper', hireDate: '2026-03-15', endDate: '2026-09-15', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-5', employeeNumber: 'EMP-11245', firstName: 'Emma', lastName: 'Brown', email: 'emma.brown@hrive.com', jobTitle: 'Finance Intern', employmentType: 'intern', departmentName: 'Finance', location: 'New York, NY', managerName: 'Nora Shah', hireDate: '2026-05-18', endDate: '2026-09-01', contractNoticeDays: 14, status: 'active' },
  { id: 'preview-6', employeeNumber: 'EMP-11467', firstName: 'James', lastName: 'Taylor', email: 'james.taylor@hrive.com', jobTitle: 'Content Producer', employmentType: 'part_time', departmentName: 'Marketing', location: 'Austin, TX', managerName: 'Aisha Carter', hireDate: '2025-11-03', endDate: '2026-08-31', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-7', employeeNumber: 'EMP-11678', firstName: 'Aisha', lastName: 'Carter', email: 'aisha.carter@hrive.com', jobTitle: 'Data Consultant', employmentType: 'contractor', clientName: 'DataWorks', departmentName: 'Analytics', location: 'Remote — US', managerName: 'Morgan Harper', hireDate: '2026-04-20', endDate: '2026-10-20', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-8', employeeNumber: 'EMP-11890', firstName: 'Riley', lastName: 'Lee', email: 'riley.lee@hrive.com', jobTitle: 'Operations Coordinator', employmentType: 'subcontract', clientName: 'BuildRight Co.', departmentName: 'Operations', location: 'Portland, OR', managerName: 'Nora Shah', hireDate: '2026-01-20', endDate: '2026-07-20', contractNoticeDays: 15, status: 'active' },
  { id: 'preview-9', employeeNumber: 'EMP-12012', firstName: 'Noah', lastName: 'Williams', email: 'noah.williams@hrive.com', jobTitle: 'Security Analyst', employmentType: 'contractor', clientName: 'CyberGuard', departmentName: 'IT Security', location: 'Boston, MA', managerName: 'Morgan Harper', hireDate: '2026-02-25', endDate: '2026-08-25', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-10', employeeNumber: 'EMP-12134', firstName: 'Lena', lastName: 'Park', email: 'lena.park@hrive.com', jobTitle: 'Customer Success Advisor', employmentType: 'part_time', departmentName: 'Customer Success', location: 'Remote — US', managerName: 'Aisha Carter', hireDate: '2026-04-10', endDate: '2026-10-10', contractNoticeDays: 14, status: 'active' },
  { id: 'preview-11', employeeNumber: 'EMP-12302', firstName: 'Jordan', lastName: 'Chen', email: 'jordan.chen@hrive.com', jobTitle: 'Support Engineer', employmentType: 'contractor', clientName: 'Northstar Group', departmentName: 'IT', location: 'San Diego, CA', managerName: 'Nora Shah', hireDate: '2026-05-01', endDate: null, contractNoticeDays: 30, status: 'active' },
  { id: 'preview-12', employeeNumber: 'EMP-12444', firstName: 'Priya', lastName: 'Rao', email: 'priya.rao@hrive.com', jobTitle: 'People Operations Intern', employmentType: 'intern', departmentName: 'People Operations', location: 'New York, NY', managerName: 'Aisha Carter', hireDate: '2026-06-01', endDate: null, contractNoticeDays: 14, status: 'active' },
  { id: 'preview-13', employeeNumber: 'EMP-12512', firstName: 'Mia', lastName: 'Davis', email: 'mia.davis@hrive.com', jobTitle: 'Compensation Consultant', employmentType: 'contractor', clientName: 'PeopleFirst', departmentName: 'People Operations', location: 'Austin, TX', managerName: 'Morgan Harper', hireDate: '2026-02-20', endDate: '2026-08-20', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-14', employeeNumber: 'EMP-12680', firstName: 'Ethan', lastName: 'Moore', email: 'ethan.moore@hrive.com', jobTitle: 'Facilities Coordinator', employmentType: 'subcontract', clientName: 'BuildRight Co.', departmentName: 'Facilities', location: 'Denver, CO', managerName: 'Nora Shah', hireDate: '2026-02-26', endDate: '2026-08-26', contractNoticeDays: 30, status: 'active' },
  { id: 'preview-15', employeeNumber: 'EMP-12745', firstName: 'Sofia', lastName: 'Nguyen', email: 'sofia.nguyen@hrive.com', jobTitle: 'Talent Intern', employmentType: 'intern', departmentName: 'Talent Acquisition', location: 'Chicago, IL', managerName: 'Aisha Carter', hireDate: '2026-05-15', endDate: '2026-08-15', contractNoticeDays: 14, status: 'active' },
  { id: 'preview-16', employeeNumber: 'EMP-12804', firstName: 'Liam', lastName: 'Chen', email: 'liam.chen@hrive.com', jobTitle: 'Operations Associate', employmentType: 'part_time', departmentName: 'Operations', location: 'Remote — US', managerName: 'Morgan Harper', hireDate: '2026-04-14', endDate: null, contractNoticeDays: 30, status: 'active' },
];

export function employeeName(employee: ContractEmployee) {
  return `${employee.firstName} ${employee.lastName}`.trim() || 'Unnamed employee';
}

export function employeeInitials(employee: ContractEmployee) {
  return `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || '—';
}

export function displayType(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());
}

export function formatShortDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Not set';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function enrichContracts(records: ContractEmployee[], now = new Date(), documents: ContractDocument[] = []): ContractEmployeeWithExpiry[] {
  return records
    .filter(employee => employee.employmentType && employee.employmentType !== 'full_time')
    .map(employee => {
      const employeeDocuments = documents.filter(document => document.employeeId === employee.id && document.status !== 'archived');
      const completedDocuments = employeeDocuments.filter(document => document.status === 'complete');
      const documentCount = employee.documentCount ?? employeeDocuments.length;
      const completedDocumentCount = employee.completedDocumentCount ?? completedDocuments.length;
      return {
        ...employee,
        expiry: getContractExpiry(employee, now),
        documentProgress: documentCount ? Math.round(completedDocumentCount / documentCount * 100) : 0,
        documentCount,
        completedDocumentCount,
        signedContractComplete: employee.signedContractComplete ?? completedDocuments.some(document => document.type === 'contract' || document.category === 'contract'),
        owner: employee.managerName || 'Unassigned',
      };
    })
    .sort((left, right) => {
      if (!left.endDate) return -1;
      if (!right.endDate) return 1;
      return new Date(left.endDate).valueOf() - new Date(right.endDate).valueOf();
    });
}

export function contractStateLabel(contract: ContractEmployeeWithExpiry) {
  if (contract.expiry.state === 'missing_end_date') return 'End date required';
  if (contract.expiry.state === 'expired') return `Expired ${Math.abs(contract.expiry.daysRemaining || 0)}d ago`;
  if (contract.expiry.state === 'due') return `${contract.expiry.daysRemaining}d left`;
  return `${contract.expiry.daysRemaining}d left`;
}

export function daysFrom(reference: Date, value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate())) / DAY_MS);
}
