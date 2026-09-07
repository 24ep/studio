export type PolicyFieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea';

export interface PolicyFieldDefinition {
  key: string;
  label: string;
  description: string;
  type: PolicyFieldType;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
}

export interface PolicySectionDefinition {
  title: string;
  description: string;
  fields: PolicyFieldDefinition[];
}

export interface PolicyAreaDefinition {
  id: string;
  title: string;
  description: string;
  settingKey: PolicyConfigurationSettingKey;
  sections: PolicySectionDefinition[];
  defaults: Record<string, string | number | boolean>;
}

export const POLICY_CONFIGURATION_SETTING_KEYS = [
  'peopleLifecycleConfiguration',
  'workforceRulesConfiguration',
  'payrollExpensesConfiguration',
  'performanceLearningConfiguration',
  'notificationRulesConfiguration',
  'serviceDeskRulesConfiguration',
  'integrationGovernanceConfiguration',
  'securityGovernanceConfiguration',
  'dataGovernanceConfiguration',
] as const;

export type PolicyConfigurationSettingKey = (typeof POLICY_CONFIGURATION_SETTING_KEYS)[number];

export const policyConfigurationAreas: PolicyAreaDefinition[] = [
  {
    id: 'people-lifecycle',
    title: 'Employee lifecycle policies',
    description: 'Set the organization defaults used for probation, contracts, offboarding, assets, and employee documents.',
    settingKey: 'peopleLifecycleConfiguration',
    defaults: {
      probationDays: 90,
      probationReviewFrequencyDays: 30,
      probationReminderDays: 7,
      contractExpiryReminderDays: 30,
      offboardingLeadDays: 14,
      requireExitInterview: true,
      requireAssetClearance: true,
      requireDocumentAcknowledgement: true,
    },
    sections: [
      {
        title: 'Probation',
        description: 'Default review cadence and reminders for new employees.',
        fields: [
          { key: 'probationDays', label: 'Default probation period', description: 'Number of calendar days in the standard probation period.', type: 'number', min: 0, max: 730 },
          { key: 'probationReviewFrequencyDays', label: 'Review frequency', description: 'Days between scheduled probation reviews.', type: 'number', min: 1, max: 365 },
          { key: 'probationReminderDays', label: 'Review reminder', description: 'Days before a review that owners are notified.', type: 'number', min: 0, max: 90 },
        ],
      },
      {
        title: 'Contracts and offboarding',
        description: 'Control expiry reminders and mandatory exit activities.',
        fields: [
          { key: 'contractExpiryReminderDays', label: 'Contract expiry reminder', description: 'Days before contract expiry that HR is notified.', type: 'number', min: 0, max: 365 },
          { key: 'offboardingLeadDays', label: 'Offboarding lead time', description: 'Default days before the final working date to start offboarding.', type: 'number', min: 0, max: 180 },
          { key: 'requireExitInterview', label: 'Require exit interview', description: 'Add an exit interview to every offboarding journey.', type: 'boolean' },
          { key: 'requireAssetClearance', label: 'Require asset clearance', description: 'Prevent completion until assigned assets are returned or waived.', type: 'boolean' },
          { key: 'requireDocumentAcknowledgement', label: 'Require document acknowledgement', description: 'Require employees to acknowledge lifecycle documents.', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'workforce-rules',
    title: 'Workforce rules',
    description: 'Configure attendance, schedules, shifts, overtime, holidays, and leave behavior.',
    settingKey: 'workforceRulesConfiguration',
    defaults: {
      timezone: 'Asia/Bangkok',
      standardWeeklyHours: 40,
      lateGraceMinutes: 10,
      overtimeApprovalRequired: true,
      overtimeRoundingMinutes: 15,
      minimumShiftRestHours: 11,
      holidayWorkMultiplier: 2,
      leaveYearStartMonth: '1',
      allowNegativeLeaveBalance: false,
    },
    sections: [
      {
        title: 'Attendance and schedules',
        description: 'Default working time and attendance thresholds.',
        fields: [
          { key: 'timezone', label: 'Workforce timezone', description: 'Timezone used for attendance and scheduling calculations.', type: 'text' },
          { key: 'standardWeeklyHours', label: 'Standard weekly hours', description: 'Default contracted hours per week.', type: 'number', min: 1, max: 168 },
          { key: 'lateGraceMinutes', label: 'Late grace period', description: 'Minutes after shift start before an employee is marked late.', type: 'number', min: 0, max: 240 },
          { key: 'minimumShiftRestHours', label: 'Minimum shift rest', description: 'Minimum hours required between shifts.', type: 'number', min: 0, max: 48 },
        ],
      },
      {
        title: 'Overtime and leave',
        description: 'Approval and calculation defaults.',
        fields: [
          { key: 'overtimeApprovalRequired', label: 'Require overtime approval', description: 'Overtime must be approved before payroll processing.', type: 'boolean' },
          { key: 'overtimeRoundingMinutes', label: 'Overtime rounding', description: 'Round approved overtime to this number of minutes.', type: 'number', min: 1, max: 60 },
          { key: 'holidayWorkMultiplier', label: 'Holiday work multiplier', description: 'Default multiplier applied to approved holiday work.', type: 'number', min: 1, max: 5 },
          { key: 'leaveYearStartMonth', label: 'Leave year starts', description: 'Month when annual leave balances reset.', type: 'select', options: Array.from({ length: 12 }, (_, index) => ({ label: new Date(2026, index, 1).toLocaleString('en', { month: 'long' }), value: String(index + 1) })) },
          { key: 'allowNegativeLeaveBalance', label: 'Allow negative leave balance', description: 'Employees may submit leave beyond their available balance.', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'payroll-expenses',
    title: 'Payroll and expense policies',
    description: 'Set pay-cycle, benefit, reimbursement, mileage, and approval defaults.',
    settingKey: 'payrollExpensesConfiguration',
    defaults: {
      baseCurrency: 'THB',
      payFrequency: 'monthly',
      payDay: 25,
      payrollCutoffDay: 20,
      requirePayrollApproval: true,
      expenseReceiptThreshold: 500,
      mileageRate: 6,
      perDiemRate: 800,
      expenseApprovalLevels: 1,
      expenseSubmissionWindowDays: 30,
    },
    sections: [
      {
        title: 'Payroll defaults',
        description: 'Core pay-period and release controls.',
        fields: [
          { key: 'baseCurrency', label: 'Base currency', description: 'Default currency for payroll, compensation, and expenses.', type: 'select', options: [{ label: 'Thai baht (THB)', value: 'THB' }, { label: 'US dollar (USD)', value: 'USD' }, { label: 'Euro (EUR)', value: 'EUR' }] },
          { key: 'payFrequency', label: 'Pay frequency', description: 'Default employee pay frequency.', type: 'select', options: [{ label: 'Monthly', value: 'monthly' }, { label: 'Biweekly', value: 'biweekly' }, { label: 'Weekly', value: 'weekly' }] },
          { key: 'payDay', label: 'Standard pay day', description: 'Calendar day used for monthly payroll.', type: 'number', min: 1, max: 31 },
          { key: 'payrollCutoffDay', label: 'Payroll cutoff day', description: 'Day after which changes move to the next pay period.', type: 'number', min: 1, max: 31 },
          { key: 'requirePayrollApproval', label: 'Require payroll approval', description: 'Payroll runs require approval before release.', type: 'boolean' },
        ],
      },
      {
        title: 'Expenses and travel',
        description: 'Receipt, mileage, per-diem, and approval defaults.',
        fields: [
          { key: 'expenseReceiptThreshold', label: 'Receipt threshold', description: 'Receipt required when a claim reaches this amount.', type: 'number', min: 0 },
          { key: 'mileageRate', label: 'Mileage rate', description: 'Reimbursement amount per kilometer.', type: 'number', min: 0 },
          { key: 'perDiemRate', label: 'Standard per diem', description: 'Default daily travel allowance.', type: 'number', min: 0 },
          { key: 'expenseApprovalLevels', label: 'Approval levels', description: 'Number of approvals required for expense claims.', type: 'number', min: 0, max: 5 },
          { key: 'expenseSubmissionWindowDays', label: 'Submission window', description: 'Days after spend date that a claim may be submitted.', type: 'number', min: 1, max: 365 },
        ],
      },
    ],
  },
  {
    id: 'performance-learning',
    title: 'Performance and learning policies',
    description: 'Configure review cycles, rating scales, goals, learning assignments, and certificate reminders.',
    settingKey: 'performanceLearningConfiguration',
    defaults: {
      reviewCycle: 'annual',
      ratingScale: '5',
      selfReviewRequired: true,
      goalWeightRequired: true,
      goalWeightTotal: 100,
      learningReminderDays: 7,
      certificateExpiryReminderDays: 30,
      managerCanAssignLearning: true,
    },
    sections: [
      {
        title: 'Performance reviews',
        description: 'Standard review cadence, scale, and goal rules.',
        fields: [
          { key: 'reviewCycle', label: 'Default review cycle', description: 'Cadence used when a review cycle is created.', type: 'select', options: [{ label: 'Quarterly', value: 'quarterly' }, { label: 'Half-yearly', value: 'half-yearly' }, { label: 'Annual', value: 'annual' }] },
          { key: 'ratingScale', label: 'Rating scale', description: 'Maximum rating used in standard appraisals.', type: 'select', options: [{ label: '3 point', value: '3' }, { label: '5 point', value: '5' }, { label: '10 point', value: '10' }] },
          { key: 'selfReviewRequired', label: 'Require self review', description: 'Employees complete a self assessment before manager review.', type: 'boolean' },
          { key: 'goalWeightRequired', label: 'Require goal weights', description: 'Goals must include a contribution weight.', type: 'boolean' },
          { key: 'goalWeightTotal', label: 'Goal weight total', description: 'Required total percentage for weighted goals.', type: 'number', min: 1, max: 100 },
        ],
      },
      {
        title: 'Learning compliance',
        description: 'Assignment and certification reminders.',
        fields: [
          { key: 'learningReminderDays', label: 'Learning due reminder', description: 'Days before a learning due date to notify the learner.', type: 'number', min: 0, max: 365 },
          { key: 'certificateExpiryReminderDays', label: 'Certificate expiry reminder', description: 'Days before certificate expiry to notify employees and managers.', type: 'number', min: 0, max: 730 },
          { key: 'managerCanAssignLearning', label: 'Manager learning assignment', description: 'Managers may assign courses and learning paths to their teams.', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notification rules',
    description: 'Control event delivery, digests, quiet hours, escalation, and template ownership.',
    settingKey: 'notificationRulesConfiguration',
    defaults: {
      inAppEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      digestFrequency: 'daily',
      quietHoursStart: '20:00',
      quietHoursEnd: '07:00',
      escalationHours: 24,
      notifyManagers: true,
      notifyHr: true,
    },
    sections: [
      {
        title: 'Delivery channels',
        description: 'Default channels used for workspace events.',
        fields: [
          { key: 'inAppEnabled', label: 'In-app notifications', description: 'Deliver supported events in the notification center.', type: 'boolean' },
          { key: 'emailEnabled', label: 'Email notifications', description: 'Allow supported events to be delivered by email.', type: 'boolean' },
          { key: 'smsEnabled', label: 'SMS notifications', description: 'Allow urgent supported events to be delivered by SMS.', type: 'boolean' },
          { key: 'digestFrequency', label: 'Digest frequency', description: 'Default schedule for non-urgent summaries.', type: 'select', options: [{ label: 'Never', value: 'never' }, { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }] },
        ],
      },
      {
        title: 'Timing and escalation',
        description: 'Quiet hours and overdue escalation defaults.',
        fields: [
          { key: 'quietHoursStart', label: 'Quiet hours start', description: 'Local time when non-urgent notifications pause.', type: 'text' },
          { key: 'quietHoursEnd', label: 'Quiet hours end', description: 'Local time when notification delivery resumes.', type: 'text' },
          { key: 'escalationHours', label: 'Escalation threshold', description: 'Hours after an overdue action before escalation.', type: 'number', min: 1, max: 720 },
          { key: 'notifyManagers', label: 'Notify managers', description: 'Include responsible managers in escalations.', type: 'boolean' },
          { key: 'notifyHr', label: 'Notify HR', description: 'Include the HR owner in escalations.', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'service-desk',
    title: 'Service desk policies',
    description: 'Define service levels, priority targets, assignment, escalation, and knowledge publishing.',
    settingKey: 'serviceDeskRulesConfiguration',
    defaults: {
      defaultPriority: 'normal',
      responseTargetHours: 8,
      resolutionTargetHours: 48,
      urgentResponseTargetHours: 1,
      autoAssignEnabled: true,
      escalationEnabled: true,
      employeeCanReopen: true,
      knowledgeApprovalRequired: true,
    },
    sections: [
      {
        title: 'Service levels',
        description: 'Default response and resolution commitments.',
        fields: [
          { key: 'defaultPriority', label: 'Default priority', description: 'Priority assigned when an employee does not choose one.', type: 'select', options: [{ label: 'Low', value: 'low' }, { label: 'Normal', value: 'normal' }, { label: 'High', value: 'high' }, { label: 'Urgent', value: 'urgent' }] },
          { key: 'responseTargetHours', label: 'Response target', description: 'Business hours allowed for the first HR response.', type: 'number', min: 1, max: 720 },
          { key: 'resolutionTargetHours', label: 'Resolution target', description: 'Business hours allowed for standard resolution.', type: 'number', min: 1, max: 2160 },
          { key: 'urgentResponseTargetHours', label: 'Urgent response target', description: 'Business hours allowed for urgent requests.', type: 'number', min: 1, max: 72 },
        ],
      },
      {
        title: 'Routing and knowledge',
        description: 'Assignment, escalation, reopening, and publishing controls.',
        fields: [
          { key: 'autoAssignEnabled', label: 'Automatic assignment', description: 'Assign new requests to configured category owners.', type: 'boolean' },
          { key: 'escalationEnabled', label: 'SLA escalation', description: 'Escalate requests that approach or exceed their targets.', type: 'boolean' },
          { key: 'employeeCanReopen', label: 'Allow employee reopen', description: 'Employees may reopen recently resolved requests.', type: 'boolean' },
          { key: 'knowledgeApprovalRequired', label: 'Knowledge approval', description: 'Require HR approval before knowledge articles are published.', type: 'boolean' },
        ],
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integration governance',
    description: 'Set connection, synchronization, webhook, API credential, and failure-handling defaults.',
    settingKey: 'integrationGovernanceConfiguration',
    defaults: {
      connectionHealthChecks: true,
      healthCheckIntervalMinutes: 15,
      syncFailureRetries: 3,
      webhookTimeoutSeconds: 15,
      webhookRetryCount: 5,
      credentialRotationDays: 90,
      allowPersonalAccessTokens: false,
      integrationOwnerEmail: '',
    },
    sections: [
      {
        title: 'Connection reliability',
        description: 'Health checks, synchronization retries, and webhook delivery.',
        fields: [
          { key: 'connectionHealthChecks', label: 'Connection health checks', description: 'Periodically verify enabled integrations.', type: 'boolean' },
          { key: 'healthCheckIntervalMinutes', label: 'Health-check interval', description: 'Minutes between integration health checks.', type: 'number', min: 5, max: 1440 },
          { key: 'syncFailureRetries', label: 'Sync retry attempts', description: 'Automatic retry attempts after synchronization failure.', type: 'number', min: 0, max: 20 },
          { key: 'webhookTimeoutSeconds', label: 'Webhook timeout', description: 'Seconds to wait for a webhook response.', type: 'number', min: 1, max: 120 },
          { key: 'webhookRetryCount', label: 'Webhook retry attempts', description: 'Delivery attempts before a webhook is marked failed.', type: 'number', min: 0, max: 20 },
        ],
      },
      {
        title: 'Credential governance',
        description: 'Credential ownership and rotation defaults.',
        fields: [
          { key: 'credentialRotationDays', label: 'Credential rotation', description: 'Recommended maximum age for integration credentials.', type: 'number', min: 1, max: 730 },
          { key: 'allowPersonalAccessTokens', label: 'Personal access tokens', description: 'Allow users to create personal integration credentials.', type: 'boolean' },
          { key: 'integrationOwnerEmail', label: 'Integration owner', description: 'Email address notified about connection failures.', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'security-governance',
    title: 'Security and access governance',
    description: 'Configure authentication assurance, sessions, access reviews, and administrator safeguards.',
    settingKey: 'securityGovernanceConfiguration',
    defaults: {
      mfaRequirement: 'admins',
      sessionIdleMinutes: 60,
      sessionMaximumHours: 12,
      passwordMinimumLength: 12,
      passwordRotationDays: 0,
      accessReviewFrequencyDays: 90,
      requireAdminApproval: true,
      blockDormantAccountsDays: 90,
      securityAlertEmail: '',
    },
    sections: [
      {
        title: 'Authentication and sessions',
        description: 'Workspace-wide identity assurance defaults.',
        fields: [
          { key: 'mfaRequirement', label: 'MFA requirement', description: 'Users required to enroll in multi-factor authentication.', type: 'select', options: [{ label: 'Optional', value: 'optional' }, { label: 'Administrators', value: 'admins' }, { label: 'Everyone', value: 'everyone' }] },
          { key: 'sessionIdleMinutes', label: 'Idle session timeout', description: 'Minutes of inactivity before reauthentication.', type: 'number', min: 5, max: 1440 },
          { key: 'sessionMaximumHours', label: 'Maximum session duration', description: 'Hours before a user must sign in again.', type: 'number', min: 1, max: 720 },
          { key: 'passwordMinimumLength', label: 'Minimum password length', description: 'Minimum characters for credential-based sign-in.', type: 'number', min: 8, max: 128 },
          { key: 'passwordRotationDays', label: 'Password rotation', description: 'Days before password rotation; use 0 to disable forced rotation.', type: 'number', min: 0, max: 730 },
        ],
      },
      {
        title: 'Access governance',
        description: 'Review cadence and administrative safeguards.',
        fields: [
          { key: 'accessReviewFrequencyDays', label: 'Access review frequency', description: 'Days between recurring access certifications.', type: 'number', min: 1, max: 730 },
          { key: 'requireAdminApproval', label: 'Administrator approval', description: 'Require approval before granting administrator access.', type: 'boolean' },
          { key: 'blockDormantAccountsDays', label: 'Dormant account threshold', description: 'Disable accounts after this many inactive days; use 0 to disable.', type: 'number', min: 0, max: 3650 },
          { key: 'securityAlertEmail', label: 'Security alert recipient', description: 'Email address for high-priority security alerts.', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'data-governance',
    title: 'Data governance',
    description: 'Configure retention, deletion, audit evidence, export, backup, and regional defaults.',
    settingKey: 'dataGovernanceConfiguration',
    defaults: {
      applicantRetentionDays: 730,
      employeeRetentionDays: 2555,
      auditRetentionDays: 2555,
      deletionGraceDays: 30,
      exportApprovalRequired: true,
      backupFrequency: 'daily',
      backupRetentionDays: 35,
      dataResidencyRegion: 'ap-southeast-1',
      dateFormat: 'DD/MM/YYYY',
    },
    sections: [
      {
        title: 'Retention and deletion',
        description: 'Default record retention and deletion safeguards.',
        fields: [
          { key: 'applicantRetentionDays', label: 'Applicant retention', description: 'Days to retain inactive applicant records.', type: 'number', min: 0, max: 36500 },
          { key: 'employeeRetentionDays', label: 'Employee retention', description: 'Days to retain former employee records.', type: 'number', min: 0, max: 36500 },
          { key: 'auditRetentionDays', label: 'Audit retention', description: 'Days to retain audit and security evidence.', type: 'number', min: 30, max: 36500 },
          { key: 'deletionGraceDays', label: 'Deletion grace period', description: 'Days before approved deletion requests are finalized.', type: 'number', min: 0, max: 365 },
          { key: 'exportApprovalRequired', label: 'Require export approval', description: 'Sensitive bulk exports require an approver.', type: 'boolean' },
        ],
      },
      {
        title: 'Backup and region',
        description: 'Backup cadence and regional presentation defaults.',
        fields: [
          { key: 'backupFrequency', label: 'Backup frequency', description: 'Expected database backup cadence.', type: 'select', options: [{ label: 'Every 6 hours', value: '6-hours' }, { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }] },
          { key: 'backupRetentionDays', label: 'Backup retention', description: 'Days that backup snapshots should be retained.', type: 'number', min: 1, max: 3650 },
          { key: 'dataResidencyRegion', label: 'Data residency region', description: 'Declared primary region for tenant data.', type: 'text' },
          { key: 'dateFormat', label: 'Default date format', description: 'Date format used in exports and administrative reports.', type: 'select', options: [{ label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' }, { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' }, { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }] },
        ],
      },
    ],
  },
];

export function getPolicyConfigurationArea(id: string | null) {
  return policyConfigurationAreas.find(area => area.id === id) ?? policyConfigurationAreas[0];
}
