export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { buildPlatformSetupStatuses, getPlatformSetupProgress } from '@/lib/admin-platform-setup';
import { getPool } from '@/lib/db';

type PlatformSetupCountRow = {
  companyReference: number;
  companyEmailDomain: number;
  emailService: number;
  platformDefaults: number;
  recruitmentStages: number;
  applicantSources: number;
  positionLevels: number;
  grades: number;
  headcountTypes: number;
  evaluationConfiguration: number;
  dropdownOptions: number;
  employees: number;
  departments: number;
  shiftDefinitions: number;
  shiftAssignments: number;
  attendanceRecords: number;
  leavePolicies: number;
  holidays: number;
  payrollPeriods: number;
  payrollRuns: number;
  performanceCycles: number;
  expenseClaims: number;
  documentTemplates: number;
  policyDocuments: number;
  emailOperations: number;
  onboardingTemplates: number;
  aiPrompts: number;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
  }

  try {
    const result = await getPool().query<PlatformSetupCountRow>(`
      WITH settings AS (
        SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) AS values
        FROM "SystemSetting"
      )
      SELECT
        (SELECT COUNT(*)::int FROM "CompanyReference") AS "companyReference",
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM "SystemSetting"
          WHERE key = 'organizationProfile'
            AND NULLIF(BTRIM(value::jsonb ->> 'employeeEmailDomain'), '') IS NOT NULL
        ) THEN 1 ELSE 0 END) AS "companyEmailDomain",
        CASE WHEN
          settings.values ->> 'emailServiceEnabled' = 'true'
          AND NULLIF(BTRIM(settings.values ->> 'emailFromAddress'), '') IS NOT NULL
          AND (
            (
              COALESCE(settings.values ->> 'emailProvider', 'smtp') = 'smtp'
              AND NULLIF(BTRIM(settings.values ->> 'emailSmtpHost'), '') IS NOT NULL
              AND NULLIF(BTRIM(settings.values ->> 'emailSmtpUser'), '') IS NOT NULL
              AND NULLIF(BTRIM(settings.values ->> 'emailSmtpPassword'), '') IS NOT NULL
            ) OR (
              COALESCE(settings.values ->> 'emailProvider', 'smtp') <> 'smtp'
              AND NULLIF(BTRIM(settings.values ->> 'emailApiKey'), '') IS NOT NULL
              AND (
                settings.values ->> 'emailProvider' <> 'mailgun'
                OR NULLIF(BTRIM(settings.values ->> 'emailMailgunDomain'), '') IS NOT NULL
              )
            )
          )
        THEN 1 ELSE 0 END AS "emailService",
        (SELECT COUNT(*)::int FROM "SystemSetting"
          WHERE key IN ('appLogoDataUrl', 'defaultMatchCriteria', 'applicantEvaluationCriteriaPrompt')) AS "platformDefaults",
        (SELECT COUNT(*)::int FROM "RecruitmentStage" WHERE is_system = false) AS "recruitmentStages",
        (SELECT COUNT(*)::int FROM "ApplicantSource") AS "applicantSources",
        (SELECT COUNT(*)::int FROM "PositionLevel") AS "positionLevels",
        (SELECT COUNT(*)::int FROM "Grade") AS "grades",
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM "SystemSetting"
          WHERE key = 'headcountTypeOptions'
            AND jsonb_typeof(value::jsonb) = 'array'
            AND jsonb_array_length(value::jsonb) > 0
        ) THEN 1 ELSE 0 END) AS "headcountTypes",
        ((SELECT COUNT(*)::int FROM "ExpertiseGroup")
          + (SELECT COUNT(*)::int FROM "ExpertiseSkill")
          + (SELECT COUNT(*)::int FROM "PersonalityGroup")
          + (SELECT COUNT(*)::int FROM "PersonalityTrait")
          + (SELECT COUNT(*)::int FROM "SkillTemplate")) AS "evaluationConfiguration",
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM "SystemSetting" WHERE key = 'dropdownOptionCatalog'
            AND jsonb_typeof(value::jsonb) = 'array' AND jsonb_array_length(value::jsonb) > 0
        ) THEN 1 ELSE 0 END) AS "dropdownOptions",
        (SELECT COUNT(*)::int FROM "hr_employees") AS "employees",
        (SELECT COUNT(*)::int FROM "hr_departments") AS "departments",
        (SELECT COUNT(*)::int FROM "hr_shift_definitions") AS "shiftDefinitions",
        (SELECT COUNT(*)::int FROM "hr_shift_assignments") AS "shiftAssignments",
        (SELECT COUNT(*)::int FROM "hr_attendance_records") AS "attendanceRecords",
        (SELECT COUNT(*)::int FROM "hr_leave_policies" WHERE is_active = true) AS "leavePolicies",
        (SELECT COUNT(*)::int FROM "hr_holidays") AS "holidays",
        (SELECT COUNT(*)::int FROM "hr_payroll_periods") AS "payrollPeriods",
        (SELECT COUNT(*)::int FROM "hr_payroll_runs") AS "payrollRuns",
        (SELECT COUNT(*)::int FROM "hr_performance_cycles") AS "performanceCycles",
        (SELECT COUNT(*)::int FROM "expense_claims") AS "expenseClaims",
        (SELECT COALESCE(jsonb_array_length(value::jsonb), 0) FROM "SystemSetting" WHERE key = 'documentTemplates' LIMIT 1) AS "documentTemplates",
        (SELECT COALESCE(jsonb_array_length(COALESCE(value::jsonb -> 'documents', '[]'::jsonb)), 0) FROM "SystemSetting" WHERE key = 'policyDocumentsLocalStore' LIMIT 1) AS "policyDocuments",
        (SELECT COALESCE(jsonb_array_length(value::jsonb), 0) FROM "SystemSetting" WHERE key = 'emailOperationConfigs' LIMIT 1) AS "emailOperations",
        (SELECT COUNT(*)::int FROM "hr_onboarding_templates" WHERE is_active = true) AS "onboardingTemplates",
        (SELECT COUNT(*)::int FROM "SystemPrompt") AS "aiPrompts"
      FROM settings
    `);
    const row = result.rows[0];
    const features = buildPlatformSetupStatuses({
      'company-reference': row?.companyReference || 0,
      'company-email-domain': row?.companyEmailDomain || 0,
      'email-service': row?.emailService || 0,
      'platform-defaults': row?.platformDefaults || 0,
      'recruitment-stages': row?.recruitmentStages || 0,
      'applicant-sources': row?.applicantSources || 0,
      'position-levels': row?.positionLevels || 0,
      grades: row?.grades || 0,
      'headcount-types': row?.headcountTypes || 0,
      'evaluation-configuration': row?.evaluationConfiguration || 0,
      'dropdown-options': row?.dropdownOptions || 0,
      'leave-policies': row?.leavePolicies || 0,
      'holiday-calendar': row?.holidays || 0,
      'document-templates': row?.documentTemplates || 0,
      'policy-documents': row?.policyDocuments || 0,
      'email-operations': row?.emailOperations || 0,
      'onboarding-templates': row?.onboardingTemplates || 0,
      'ai-prompts': row?.aiPrompts || 0,
    });
    const onboarding = {
      steps: [
        {
          id: 'platform-setup',
          title: 'Company profile and setup',
          description: 'Finish your core organization identity and notification configuration.',
          href: '/settings/company-references',
          required: true,
          ready: Boolean(row?.companyReference && row?.companyEmailDomain && row?.emailService),
          count: Number(Boolean(row?.companyReference)) + Number(Boolean(row?.companyEmailDomain)) + Number(Boolean(row?.emailService)),
          requiredCount: 3,
        },
        {
          id: 'people-module',
          title: 'People module',
          description: 'Create departments and employees so workforce data is ready for the rest of the platform.',
          href: '/people',
          required: true,
          ready: row?.departments > 0 && row?.employees > 0,
          count: Number(Boolean(row?.departments)) + Number(Boolean(row?.employees)),
          requiredCount: 2,
          metadata: `${row?.departments || 0} departments / ${row?.employees || 0} employees`,
        },
        {
          id: 'attendance-module',
          title: 'Attendance module',
          description: 'Set at least one shift definition to enable attendance capture.',
          href: '/workforce/attendance',
          required: true,
          ready: row?.shiftDefinitions > 0,
          count: row?.shiftDefinitions || 0,
          requiredCount: 1,
          metadata: `${row?.shiftDefinitions || 0} shift definitions`,
        },
        {
          id: 'leave-module',
          title: 'Leave module',
          description: 'Define leave policies so request and approval flows are available.',
          href: '/workforce/leave',
          required: true,
          ready: row?.leavePolicies > 0,
          count: row?.leavePolicies || 0,
          requiredCount: 1,
          metadata: `${row?.leavePolicies || 0} policy set`,
        },
        {
          id: 'payroll-module',
          title: 'Payroll module',
          description: 'Create payroll periods to prepare the run and export workflow.',
          href: '/payroll',
          required: true,
          ready: row?.payrollPeriods > 0,
          count: row?.payrollPeriods || 0,
          requiredCount: 1,
          metadata: `${row?.payrollPeriods || 0} payroll periods`,
        },
        {
          id: 'performance-module',
          title: 'Performance module',
          description: 'Optional performance cycles for reviews and scorecards.',
          href: '/workforce/performance',
          required: false,
          ready: row?.performanceCycles > 0,
          count: row?.performanceCycles || 0,
          requiredCount: 1,
          metadata: `${row?.performanceCycles || 0} cycle(s)`,
        },
        {
          id: 'expense-module',
          title: 'Expense module',
          description: 'Optional expense records and workflow for reimbursement.',
          href: '/expenses',
          required: false,
          ready: row?.expenseClaims > 0,
          count: row?.expenseClaims || 0,
          requiredCount: 1,
          metadata: `${row?.expenseClaims || 0} claim(s)`,
        },
      ],
    };
    const onboardingRequired = onboarding.steps.filter((step) => step.required);
    const onboardingCompleted = onboardingRequired.filter((step) => step.ready).length;
    const onboardingTotal = onboardingRequired.length;
    const onboardingProgress = {
      completed: onboardingCompleted,
      total: onboardingTotal,
      percentage: onboardingTotal === 0 ? 100 : Math.round((onboardingCompleted / onboardingTotal) * 100),
    };

    return NextResponse.json({
      features,
      progress: getPlatformSetupProgress(features),
      onboarding: {
        ...onboarding,
        title: 'Activate your workspace',
        subtitle: 'Complete the real organization tasks required before inviting your wider team. Progress is saved automatically.',
        progress: onboardingProgress,
      },
    });
  } catch (error) {
    console.error('Failed to load admin platform setup status:', error);
    return NextResponse.json({ message: 'Failed to load platform setup status' }, { status: 500 });
  }
}


