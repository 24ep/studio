import { z } from 'zod';
import type { HrModuleKey } from './hr-module-config';

export type HrFieldType = 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'json' | 'jsonValue' | 'file';

export interface HrResourceField {
  name: string;
  column: string;
  label: string;
  type: HrFieldType;
  required?: boolean;
  options?: string[];
  createOnly?: boolean;
}

export interface HrResourceConfig {
  key: string;
  table: string;
  title: string;
  permission: string;
  managePermission: string;
  labelColumn: string;
  softDelete?: {
    column: string;
    value: string | boolean;
  };
  fields: HrResourceField[];
}

const statusOptions = ['active', 'inactive', 'draft', 'pending', 'approved', 'rejected', 'completed', 'in_progress', 'not_started', 'processed', 'published'];

export const HR_RESOURCE_CONFIGS: Record<string, HrResourceConfig> = {
  clients: {
    key: 'clients',
    table: 'hr_clients',
    title: 'Client',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'status', value: 'inactive' },
    fields: [
      { name: 'clientCode', column: 'client_code', label: 'Client code', type: 'text', required: true },
      { name: 'name', column: 'name', label: 'Client name', type: 'text', required: true },
      { name: 'industry', column: 'industry', label: 'Industry', type: 'text' },
      { name: 'primaryContactName', column: 'primary_contact_name', label: 'Primary contact', type: 'text' },
      { name: 'contactEmail', column: 'contact_email', label: 'Contact email', type: 'email' },
      { name: 'contactPhone', column: 'contact_phone', label: 'Contact phone', type: 'text' },
      { name: 'website', column: 'website', label: 'Website', type: 'text' },
      { name: 'address', column: 'address', label: 'Address', type: 'textarea' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'], required: true },
      { name: 'notes', column: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  people: {
    key: 'people',
    table: 'hr_employees',
    title: 'Employee',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'email',
    softDelete: { column: 'status', value: 'inactive' },
    fields: [
      { name: 'employeeNumber', column: 'employee_number', label: 'Employee number', type: 'text', required: true },
      { name: 'firstName', column: 'first_name', label: 'First name', type: 'text', required: true },
      { name: 'lastName', column: 'last_name', label: 'Last name', type: 'text', required: true },
      { name: 'email', column: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', column: 'phone', label: 'Phone', type: 'text' },
      { name: 'jobTitle', column: 'job_title', label: 'Job title', type: 'text' },
      { name: 'employmentType', column: 'employment_type', label: 'Employment type', type: 'select', options: ['full_time', 'part_time', 'contractor', 'subcontract', 'intern'], required: true },
      { name: 'clientId', column: 'client_id', label: 'Client', type: 'text' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'onboarding', 'probation'], required: true },
      { name: 'hireDate', column: 'hire_date', label: 'Hire date', type: 'date' },
      { name: 'location', column: 'location', label: 'Location', type: 'text' },
      { name: 'preferredName', column: 'preferred_name', label: 'Preferred name', type: 'text' },
      { name: 'departmentId', column: 'department_id', label: 'Department ID', type: 'text' },
      { name: 'managerId', column: 'manager_id', label: 'Manager ID', type: 'text' },
      { name: 'positionId', column: 'position_id', label: 'Position ID', type: 'text' },
      { name: 'companyId', column: 'company_id', label: 'Company ID', type: 'text' },
      { name: 'endDate', column: 'end_date', label: 'End date', type: 'date' },
      { name: 'contractNoticeDays', column: 'contract_notice_days', label: 'Contract end notice (days)', type: 'number' },
      { name: 'probationPeriodDays', column: 'probation_period_days', label: 'Probation period (days)', type: 'number' },
      { name: 'probationEvaluationFrequencyDays', column: 'probation_evaluation_frequency_days', label: 'Probation evaluation frequency (days)', type: 'number' },
      { name: 'legalName', column: 'legal_name', label: 'Legal name', type: 'text' },
      { name: 'businessUnit', column: 'business_unit', label: 'Business unit', type: 'text' },
      { name: 'workPhone', column: 'work_phone', label: 'Work phone', type: 'text' },
      { name: 'profilePhotoUrl', column: 'profile_photo_url', label: 'Profile photo URL', type: 'text' },
      { name: 'personalInformation', column: 'personal_information', label: 'Personal information', type: 'jsonValue' },
      { name: 'address', column: 'address', label: 'Address', type: 'jsonValue' },
      { name: 'emergencyContacts', column: 'emergency_contacts', label: 'Emergency contacts', type: 'jsonValue' },
      { name: 'familyDependents', column: 'family_dependents', label: 'Family and dependents', type: 'jsonValue' },
      { name: 'bankInformation', column: 'bank_information', label: 'Bank information', type: 'jsonValue' },
      { name: 'taxInformation', column: 'tax_information', label: 'Tax information', type: 'jsonValue' },
      { name: 'governmentIdentification', column: 'government_identification', label: 'Government identification', type: 'jsonValue' },
      { name: 'education', column: 'education', label: 'Education', type: 'jsonValue' },
      { name: 'workExperience', column: 'work_experience', label: 'Work experience', type: 'jsonValue' },
      { name: 'skills', column: 'skills', label: 'Skills', type: 'jsonValue' },
      { name: 'certifications', column: 'certifications', label: 'Certifications', type: 'jsonValue' },
      { name: 'languages', column: 'languages', label: 'Languages', type: 'jsonValue' },
      { name: 'profileCompletion', column: 'profile_completion', label: 'Profile completion', type: 'number' },
    ],
  },
  teams: {
    key: 'teams',
    table: 'hr_departments',
    title: 'Department',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'name', column: 'name', label: 'Unit name', type: 'text', required: true },
      { name: 'code', column: 'code', label: 'Code', type: 'text' },
      { name: 'division', column: 'division', label: 'Division', type: 'text', required: true },
      { name: 'department', column: 'department', label: 'Department', type: 'text', required: true },
      { name: 'section', column: 'section', label: 'Section', type: 'text', required: true },
      { name: 'unitType', column: 'unit_type', label: 'Unit type', type: 'select', options: ['division', 'department', 'section', 'unit'], required: true },
      { name: 'parentId', column: 'parent_id', label: 'Parent unit', type: 'text' },
      { name: 'sortOrder', column: 'sort_order', label: 'Sort order', type: 'number', required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'headcountAllocation', column: 'headcount_allocation', label: 'Headcount allocation', type: 'number' },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  onboarding: {
    key: 'onboarding',
    table: 'hr_employee_onboarding',
    title: 'Onboarding case',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'templateId', column: 'template_id', label: 'Template ID', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['not_started', 'in_progress', 'completed', 'archived'], required: true },
      { name: 'progress', column: 'progress', label: 'Progress', type: 'number', required: true },
      { name: 'startDate', column: 'start_date', label: 'Start date', type: 'date' },
      { name: 'targetDate', column: 'target_date', label: 'Target date', type: 'date' },
    ],
  },
  onboardingTemplates: {
    key: 'onboardingTemplates',
    table: 'hr_onboarding_templates',
    title: 'Onboarding template',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  onboardingTasks: {
    key: 'onboardingTasks',
    table: 'hr_onboarding_tasks',
    title: 'Onboarding task',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'title',
    fields: [
      { name: 'templateId', column: 'template_id', label: 'Template ID', type: 'text' },
      { name: 'title', column: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'detailedInstructions', column: 'detailed_instructions', label: 'Detailed instructions', type: 'textarea' },
      { name: 'tags', column: 'tags', label: 'Tags', type: 'jsonValue' },
      { name: 'ownerRole', column: 'owner_role', label: 'Owner role', type: 'select', options: ['hr', 'manager', 'employee', 'it'], required: true },
      { name: 'dueDay', column: 'due_day', label: 'Due day', type: 'number', required: true },
      { name: 'sortOrder', column: 'sort_order', label: 'Sort order', type: 'number', required: true },
      { name: 'isRequired', column: 'is_required', label: 'Required', type: 'select', options: ['true', 'false'], required: true },
      { name: 'employeeVisibility', column: 'employee_visibility', label: 'Employee visibility', type: 'select', options: ['visible', 'after_assigned', 'hidden'], required: true },
    ],
  },
  documents: {
    key: 'documents',
    table: 'hr_employee_documents',
    title: 'Employee document',
    permission: 'HR_PEOPLE_VIEW',
    managePermission: 'HR_PEOPLE_MANAGE',
    labelColumn: 'title',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'title', column: 'title', label: 'Title', type: 'text', required: true },
      { name: 'type', column: 'type', label: 'Type', type: 'select', options: ['contract', 'policy', 'identity', 'certificate', 'other'], required: true },
      { name: 'category', column: 'category', label: 'Category', type: 'select', options: ['contract', 'policy', 'identity', 'certificate', 'other'], required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['pending', 'complete', 'expired', 'archived'], required: true },
      { name: 'issueDate', column: 'issue_date', label: 'Issue date', type: 'date' },
      { name: 'expiresAt', column: 'expires_at', label: 'Expires at', type: 'date' },
      { name: 'confidentialityLevel', column: 'confidentiality_level', label: 'Confidentiality', type: 'select', options: ['employee', 'manager', 'hr'], required: true },
      { name: 'versionNumber', column: 'version_number', label: 'Version', type: 'select', options: ['1'], required: true },
      { name: 'requiresAcknowledgment', column: 'requires_acknowledgment', label: 'Require acknowledgment', type: 'select', options: ['false', 'true'], required: true },
      { name: 'file', column: 'file_path', label: 'File', type: 'file' },
    ],
  },
  attendance: {
    key: 'attendance',
    table: 'hr_attendance_records',
    title: 'Attendance record',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'void' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'workDate', column: 'work_date', label: 'Work date', type: 'date', required: true },
      { name: 'hoursWorked', column: 'hours_worked', label: 'Hours worked', type: 'number', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['present', 'late', 'absent', 'remote', 'void'], required: true },
      { name: 'source', column: 'source', label: 'Source', type: 'select', options: ['manual', 'import', 'clock'], required: true },
    ],
  },
  workSchedules: {
    key: 'workSchedules',
    table: 'hr_work_schedules',
    title: 'Work schedule',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'weeklyHours', column: 'weekly_hours', label: 'Weekly hours', type: 'number', required: true },
      { name: 'timezone', column: 'timezone', label: 'Timezone', type: 'text', required: true },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  shiftAssignments: {
    key: 'shiftAssignments',
    table: 'hr_shift_assignments',
    title: 'Shift assignment',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'cancelled' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'scheduleId', column: 'schedule_id', label: 'Schedule ID', type: 'text' },
      { name: 'shiftDate', column: 'shift_date', label: 'Shift date', type: 'date', required: true },
      { name: 'startTime', column: 'start_time', label: 'Start time', type: 'text', required: true },
      { name: 'endTime', column: 'end_time', label: 'End time', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled'], required: true },
    ],
  },
  leave: {
    key: 'leave',
    table: 'hr_leave_requests',
    title: 'Leave request',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'cancelled' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'startDate', column: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', column: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'days', column: 'days', label: 'Days', type: 'number', required: true },
      { name: 'reason', column: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected', 'cancelled'], required: true },
    ],
  },
  leavePolicies: {
    key: 'leavePolicies',
    table: 'hr_leave_policies',
    title: 'Leave policy',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'leaveType', column: 'leave_type', label: 'Leave type', type: 'select', options: ['annual', 'sick', 'personal', 'maternity', 'unpaid', 'other'], required: true },
      { name: 'annualAllowance', column: 'annual_allowance', label: 'Annual allowance', type: 'number', required: true },
      { name: 'requiresApproval', column: 'requires_approval', label: 'Requires approval', type: 'select', options: ['true', 'false'], required: true },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  leaveBalances: {
    key: 'leaveBalances',
    table: 'hr_leave_balances',
    title: 'Leave balance',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'employee_id',
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'policyId', column: 'policy_id', label: 'Policy ID', type: 'text', required: true },
      { name: 'year', column: 'year', label: 'Year', type: 'number', required: true },
      { name: 'allocated', column: 'allocated', label: 'Allocated', type: 'number', required: true },
      { name: 'used', column: 'used', label: 'Used', type: 'number', required: true },
      { name: 'pending', column: 'pending', label: 'Pending', type: 'number', required: true },
    ],
  },
  holidays: {
    key: 'holidays',
    table: 'hr_holidays',
    title: 'Holiday',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'name',
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'holidayDate', column: 'holiday_date', label: 'Holiday date', type: 'date', required: true },
      { name: 'location', column: 'location', label: 'Location', type: 'text' },
      { name: 'isPaid', column: 'is_paid', label: 'Paid', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  leaveBlocks: {
    key: 'leaveBlocks',
    table: 'hr_leave_blocks',
    title: 'Leave block',
    permission: 'HR_WORKFORCE_VIEW',
    managePermission: 'HR_WORKFORCE_MANAGE',
    labelColumn: 'name',
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'startDate', column: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', column: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'leaveType', column: 'leave_type', label: 'Leave type', type: 'select', options: ['all', 'annual', 'sick', 'personal', 'maternity', 'unpaid', 'other'], required: true },
      { name: 'scope', column: 'scope', label: 'Scope', type: 'select', options: ['all', 'department', 'location'], required: true },
      { name: 'targetValue', column: 'target_value', label: 'Target', type: 'text' },
      { name: 'reason', column: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  performance: {
    key: 'performance',
    table: 'hr_performance_reviews',
    title: 'Performance review',
    permission: 'HR_PERFORMANCE_VIEW',
    managePermission: 'HR_PERFORMANCE_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'cycleId', column: 'cycle_id', label: 'Cycle ID', type: 'text', required: true },
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'reviewerId', column: 'reviewer_id', label: 'Reviewer ID', type: 'text' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['not_started', 'in_progress', 'completed', 'archived'], required: true },
      { name: 'rating', column: 'rating', label: 'Rating', type: 'number' },
      { name: 'summary', column: 'summary', label: 'Summary', type: 'textarea' },
    ],
  },
  performanceCycles: {
    key: 'performanceCycles',
    table: 'hr_performance_cycles',
    title: 'Performance cycle',
    permission: 'HR_PERFORMANCE_VIEW',
    managePermission: 'HR_PERFORMANCE_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'startDate', column: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', column: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'closed', 'archived'], required: true },
    ],
  },
  performanceGoals: {
    key: 'performanceGoals',
    table: 'hr_performance_goals',
    title: 'Performance goal',
    permission: 'HR_PERFORMANCE_VIEW',
    managePermission: 'HR_PERFORMANCE_MANAGE',
    labelColumn: 'title',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'reviewId', column: 'review_id', label: 'Review ID', type: 'text' },
      { name: 'title', column: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'cancelled', 'archived'], required: true },
      { name: 'progress', column: 'progress', label: 'Progress', type: 'number', required: true },
      { name: 'dueDate', column: 'due_date', label: 'Due date', type: 'date' },
    ],
  },
  learning: {
    key: 'learning',
    table: 'hr_learning_enrollments',
    title: 'Learning enrollment',
    permission: 'HR_LEARNING_VIEW',
    managePermission: 'HR_LEARNING_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'courseId', column: 'course_id', label: 'Course ID', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['assigned', 'in_progress', 'completed', 'archived'], required: true },
      { name: 'progress', column: 'progress', label: 'Progress', type: 'number', required: true },
      { name: 'dueDate', column: 'due_date', label: 'Due date', type: 'date' },
    ],
  },
  learningCourses: {
    key: 'learningCourses',
    table: 'hr_learning_courses',
    title: 'Learning course',
    permission: 'HR_LEARNING_VIEW',
    managePermission: 'HR_LEARNING_MANAGE',
    labelColumn: 'title',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'title', column: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', column: 'category', label: 'Category', type: 'text' },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'durationHours', column: 'duration_hours', label: 'Duration hours', type: 'number' },
      { name: 'coverImageUrl', column: 'cover_image_url', label: 'Cover image', type: 'text' },
      { name: 'isRequired', column: 'is_required', label: 'Required', type: 'select', options: ['true', 'false'], required: true },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  learningPaths: {
    key: 'learningPaths',
    table: 'hr_learning_paths',
    title: 'Learning path',
    permission: 'HR_LEARNING_VIEW',
    managePermission: 'HR_LEARNING_MANAGE',
    labelColumn: 'title',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'title', column: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'archived'], required: true },
      { name: 'courseIds', column: 'course_ids', label: 'Courses', type: 'json', required: true },
    ],
  },
  certifications: {
    key: 'certifications',
    table: 'hr_certifications',
    title: 'Certification',
    permission: 'HR_LEARNING_VIEW',
    managePermission: 'HR_LEARNING_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'status', value: 'archived' },
    fields: [
      { name: 'recordType', column: 'record_type', label: 'Record type', type: 'select', options: ['employee', 'trusted'], required: true },
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text' },
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'issuer', column: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'validityMonths', column: 'validity_months', label: 'Standard validity (months)', type: 'number' },
      { name: 'verificationUrl', column: 'verification_url', label: 'Verification URL', type: 'text' },
      { name: 'issuedAt', column: 'issued_at', label: 'Issued at', type: 'date' },
      { name: 'expiresAt', column: 'expires_at', label: 'Expires at', type: 'date' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'archived'], required: true },
      { name: 'verificationStatus', column: 'verification_status', label: 'HR verification', type: 'select', options: ['pending', 'verified', 'rejected'], required: true },
      { name: 'verifiedAt', column: 'verified_at', label: 'Verified at', type: 'date' },
      { name: 'verifiedById', column: 'verified_by_id', label: 'Verified by', type: 'text' },
      { name: 'policyMetadata', column: 'policy_metadata', label: 'Trust policy metadata', type: 'jsonValue' },
    ],
  },
  payroll: {
    key: 'payroll',
    table: 'hr_payroll_runs',
    title: 'Payroll run',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'period_id',
    softDelete: { column: 'status', value: 'void' },
    fields: [
      { name: 'periodId', column: 'period_id', label: 'Period ID', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['draft', 'processed', 'void'], required: true },
      { name: 'grossTotal', column: 'gross_total', label: 'Gross total', type: 'number', required: true },
      { name: 'netTotal', column: 'net_total', label: 'Net total', type: 'number', required: true },
    ],
  },
  payrollPeriods: {
    key: 'payrollPeriods',
    table: 'hr_payroll_periods',
    title: 'Payroll period',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'status', value: 'closed' },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'startDate', column: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', column: 'end_date', label: 'End date', type: 'date', required: true },
      { name: 'payDate', column: 'pay_date', label: 'Pay date', type: 'date', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['open', 'locked', 'closed'], required: true },
    ],
  },
  payrollRunItems: {
    key: 'payrollRunItems',
    table: 'hr_payroll_run_items',
    title: 'Payroll run item',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'void' },
    fields: [
      { name: 'payrollRunId', column: 'payroll_run_id', label: 'Payroll run ID', type: 'text', required: true },
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'grossPay', column: 'gross_pay', label: 'Gross pay', type: 'number', required: true },
      { name: 'netPay', column: 'net_pay', label: 'Net pay', type: 'number', required: true },
      { name: 'adjustments', column: 'adjustments', label: 'Adjustments', type: 'number', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['draft', 'processed', 'void'], required: true },
    ],
  },
  payslips: {
    key: 'payslips',
    table: 'hr_payslips',
    title: 'Payslip',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'void' },
    fields: [
      { name: 'payrollRunItemId', column: 'payroll_run_item_id', label: 'Payroll run item ID', type: 'text', required: true },
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'void'], required: true },
      { name: 'filePath', column: 'file_path', label: 'File path', type: 'text' },
    ],
  },
  compensation: {
    key: 'compensation',
    table: 'hr_compensation_packages',
    title: 'Compensation package',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'effective_to', value: 'now' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'baseSalary', column: 'base_salary', label: 'Base salary', type: 'number', required: true },
      { name: 'currency', column: 'currency', label: 'Currency', type: 'select', options: ['THB', 'USD', 'EUR'], required: true },
      { name: 'payFrequency', column: 'pay_frequency', label: 'Pay frequency', type: 'select', options: ['monthly', 'weekly', 'hourly'], required: true },
      { name: 'effectiveFrom', column: 'effective_from', label: 'Effective from', type: 'date', required: true },
    ],
  },
  benefits: {
    key: 'benefits',
    table: 'hr_benefit_plans',
    title: 'Benefit plan',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'name',
    softDelete: { column: 'is_active', value: false },
    fields: [
      { name: 'name', column: 'name', label: 'Name', type: 'text', required: true },
      { name: 'type', column: 'type', label: 'Type', type: 'select', options: ['health', 'dental', 'insurance', 'retirement', 'allowance', 'other'], required: true },
      { name: 'description', column: 'description', label: 'Description', type: 'textarea' },
      { name: 'employerCost', column: 'employer_cost', label: 'Employer cost', type: 'number', required: true },
      { name: 'employeeCost', column: 'employee_cost', label: 'Employee cost', type: 'number', required: true },
      { name: 'isActive', column: 'is_active', label: 'Active', type: 'select', options: ['true', 'false'], required: true },
    ],
  },
  benefitEnrollments: {
    key: 'benefitEnrollments',
    table: 'hr_employee_benefit_enrollments',
    title: 'Benefit enrollment',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'ended' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'benefitPlanId', column: 'benefit_plan_id', label: 'Benefit plan ID', type: 'text', required: true },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['active', 'waived', 'ended'], required: true },
      { name: 'enrolledAt', column: 'enrolled_at', label: 'Enrolled at', type: 'date', required: true },
      { name: 'endedAt', column: 'ended_at', label: 'Ended at', type: 'date' },
    ],
  },
  payrollAdjustments: {
    key: 'payrollAdjustments',
    table: 'hr_payroll_adjustments',
    title: 'Payroll adjustment',
    permission: 'HR_PAYROLL_VIEW',
    managePermission: 'HR_PAYROLL_MANAGE',
    labelColumn: 'employee_id',
    softDelete: { column: 'status', value: 'void' },
    fields: [
      { name: 'employeeId', column: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'periodId', column: 'period_id', label: 'Period ID', type: 'text' },
      { name: 'type', column: 'type', label: 'Type', type: 'select', options: ['bonus', 'deduction', 'reimbursement', 'correction', 'other'], required: true },
      { name: 'amount', column: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'reason', column: 'reason', label: 'Reason', type: 'textarea' },
      { name: 'status', column: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'processed', 'void'], required: true },
    ],
  },
};

export function getHrResourceKey(moduleKey: HrModuleKey, view?: string | null) {
  if (moduleKey === 'onboarding') {
    if (view === 'templates') return 'onboardingTemplates';
    if (view === 'tasks') return 'onboardingTasks';
    return 'onboarding';
  }

  if (moduleKey === 'attendance') {
    if (view === 'schedules') return 'workSchedules';
    if (view === 'shifts') return 'shiftAssignments';
    if (view === 'holidays') return 'holidays';
    return 'attendance';
  }

  if (moduleKey === 'leave') {
    if (view === 'policies') return 'leavePolicies';
    if (view === 'balances') return 'leaveBalances';
    if (view === 'holidays') return 'holidays';
    if (view === 'blocks') return 'leaveBlocks';
    return 'leave';
  }

  if (moduleKey === 'performance') {
    if (view === 'cycles') return 'performanceCycles';
    if (view === 'goals') return 'performanceGoals';
    return 'performance';
  }

  if (moduleKey === 'learning') {
    if (view === 'courses') return 'learningCourses';
    if (view === 'paths') return 'learningPaths';
    if (view === 'certifications') return 'certifications';
    return 'learning';
  }

  if (moduleKey === 'benefits') {
    if (view === 'enrollments') return 'benefitEnrollments';
    return 'benefits';
  }

  if (moduleKey === 'payroll') {
    if (view === 'periods') return 'payrollPeriods';
    if (view === 'items') return 'payrollRunItems';
    if (view === 'runs') return 'payroll';
    if (view === 'payslips') return 'payslips';
    if (view === 'compensation') return 'compensation';
    if (view === 'adjustments') return 'payrollAdjustments';
    return 'payroll';
  }

  if (moduleKey === 'payroll-runs') {
    if (view === 'periods') return 'payrollPeriods';
    if (view === 'items') return 'payrollRunItems';
    if (view === 'adjustments') return 'payrollAdjustments';
    return 'payroll';
  }
  if (moduleKey === 'payslips') {
    if (view === 'items') return 'payrollRunItems';
    return 'payslips';
  }
  if (moduleKey === 'compensation') {
    if (view === 'adjustments') return 'payrollAdjustments';
    return 'compensation';
  }
  if (moduleKey === 'payroll-reports') {
    if (view === 'periods') return 'payrollPeriods';
    if (view === 'items') return 'payrollRunItems';
    if (view === 'payslips') return 'payslips';
    if (view === 'adjustments') return 'payrollAdjustments';
    return 'payroll';
  }
  return moduleKey;
}

export function getHrResourceConfig(moduleKey: HrModuleKey, view?: string | null) {
  return HR_RESOURCE_CONFIGS[getHrResourceKey(moduleKey, view)];
}

export function buildHrResourceSchema(config: HrResourceConfig, partial = false) {
  const shape = Object.fromEntries(config.fields
    .filter(field => field.type !== 'file')
    .map((field) => {
      let schema: z.ZodTypeAny;
      if (field.type === 'number') {
        schema = z.coerce.number();
      } else if (field.type === 'json') {
        schema = z.array(z.string().uuid()).min(1, `${field.label} must include at least one item`);
      } else if (field.type === 'jsonValue') {
        schema = z.unknown();
      } else if (field.type === 'date') {
        schema = z.string().min(1).optional().nullable();
      } else if (field.type === 'select' && field.options?.length) {
        schema = z.string().min(1, `${field.label} is required`).refine(value => field.options?.includes(value), `${field.label} is invalid`);
      } else if (field.type === 'email') {
        schema = z.string().min(1, `${field.label} is required`).email();
      } else {
        schema = z.string().min(1, `${field.label} is required`);
      }

      if (!field.required || partial) {
        schema = schema.optional().nullable();
      }

      return [field.name, schema];
    }));

  const schema = z.object(shape);
  if (config.key === 'teams') {
    return schema.superRefine((values, context) => {
      const allocation = values.headcountAllocation;
      if (allocation !== undefined && allocation !== null && (!Number.isInteger(allocation) || allocation < 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['headcountAllocation'],
          message: 'Headcount allocation must be a non-negative whole number',
        });
      }
    });
  }
  if (config.key !== 'certifications' || partial) return schema;
  return schema.superRefine((values, context) => {
    if (values.recordType === 'employee' && !values.employeeId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['employeeId'],
        message: 'Employee ID is required',
      });
    }
    if (values.recordType === 'trusted') {
      if (!values.issuer) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['issuer'],
          message: 'Issuer is required for a trusted certificate',
        });
      }
      if (!values.verificationUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['verificationUrl'],
          message: 'Official verification URL is required for a trusted certificate',
        });
      } else {
        try {
          const url = new URL(String(values.verificationUrl));
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['verificationUrl'],
            message: 'Official verification URL must be a valid HTTP(S) URL',
          });
        }
      }
      const metadata = values.policyMetadata as Record<string, unknown> | undefined;
      if (!metadata?.category) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['policyMetadata', 'category'],
          message: 'Category is required for a trusted certificate',
        });
      }
    }
  });
}

export { coerceHrFieldValue } from './hr-resource-value-utils';

export function isValidHrStatus(value: string) {
  return statusOptions.includes(value);
}