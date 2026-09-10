import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ADMIN_DEFAULT_PERMISSIONS, AUDITOR_DEFAULT_PERMISSIONS, RECRUITER_DEFAULT_PERMISSIONS } from './seed-role-permissions';
import { buildSeedTemplateHtml, createSeededEmailTemplateCatalog } from '../src/lib/email-template-catalog';
import { createSeededDocumentTemplates } from '../src/lib/document-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('Database Initialization Started');
  console.log('================================');

  try {
    // Create admin user if none exists
    const adminCount = await prisma.user.count({
      where: { role: 'Admin' }
    });

    let adminEmail = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';

    if (adminCount === 0) {
      console.log('No admin user found. Creating initial admin...');
      const adminPassword = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || (Math.random().toString(36).slice(-10) + '!');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: 'Admin',
          authenticationMethods: ['basic'],
          forcePasswordChange: false
        }
      });
      console.log('✓ Admin user created:', adminEmail);
      if (!process.env.ADMIN_PASSWORD && !process.env.SEED_ADMIN_PASSWORD) {
        console.warn('⚠️ Generated random password for new admin:', adminPassword);
      }
    } else {
      console.log('Admin user(s) already exist. Skipping initial admin creation.');
      // Find the existing admin email to use for subsequent steps
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'Admin' },
        select: { email: true }
      });
      if (existingAdmin) {
        adminEmail = existingAdmin.email;
      }
    }

    console.log('Recruitment stages are loaded on demand from AppKit.');

    // Create default user groups with detailed permissions
    console.log('Creating default user groups...');

    // First, check if groups already exist by name
    const existingAdminGroup = await prisma.userGroup.findUnique({
      where: { name: 'Admin' }
    });

    const existingRecruiterGroup = await prisma.userGroup.findUnique({
      where: { name: 'Recruiter' }
    });

    const existingAuditorGroup = await prisma.userGroup.findUnique({
      where: { name: 'External Auditor' }
    });

    const existingHiringManagerGroup = await prisma.userGroup.findUnique({
      where: { name: 'Hiring Manager' }
    });

    const existingPreRegisteredGroup = await prisma.userGroup.findUnique({
      where: { name: 'Pre-Registered User' }
    });

    const existingEmployeeGroup = await prisma.userGroup.findUnique({
      where: { name: 'Employee' }
    });

    // Create or update admin group
    let adminGroup;
    if (existingAdminGroup) {
      console.log('   Syncing existing Administrators group permissions...');
      adminGroup = await prisma.userGroup.update({
        where: { id: existingAdminGroup.id },
        data: {
          description: 'Full system access and management',
          permissions: [...ADMIN_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        }
      });
    } else {
      console.log('   Creating new Administrators group...');
      adminGroup = await prisma.userGroup.create({
        data: {
          name: 'Admin',
          description: 'Full system access and management',
          permissions: [...ADMIN_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        }
      });
    }

    if (existingAuditorGroup) {
      console.log('   Syncing read-only External Auditor group permissions...');
      await prisma.userGroup.update({
        where: { id: existingAuditorGroup.id },
        data: {
          description: 'Read-only, company-scoped audit evidence access',
          permissions: [...AUDITOR_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        }
      });
    } else {
      console.log('   Creating read-only External Auditor group...');
      await prisma.userGroup.create({
        data: {
          name: 'External Auditor',
          description: 'Read-only, company-scoped audit evidence access',
          permissions: [...AUDITOR_DEFAULT_PERMISSIONS],
          isDefault: false,
          isSystemRole: true,
        }
      });
    }

    // Create or update recruiter group
    let recruiterGroup;
    if (existingRecruiterGroup) {
      console.log('   Syncing existing Recruiter group permissions...');
      recruiterGroup = await prisma.userGroup.update({
        where: { id: existingRecruiterGroup.id },
        data: {
          description: 'Standard recruiter access',
          permissions: [...RECRUITER_DEFAULT_PERMISSIONS],
          isDefault: true,
          isSystemRole: false,
        }
      });
    } else {
      console.log('   Creating new Recruiter group...');
      recruiterGroup = await prisma.userGroup.create({
        data: {
          name: 'Recruiter',
          description: 'Standard recruiter access',
          permissions: [...RECRUITER_DEFAULT_PERMISSIONS],
          isDefault: true,
          isSystemRole: false,
        }
      });
    }

    // Create or update Recruiter Manager group
    const existingRecruiterManagerGroup = await prisma.userGroup.findUnique({
      where: { name: 'Recruiter Manager' }
    });

    let recruiterManagerGroup;
    if (existingRecruiterManagerGroup) {
      console.log('   Preserving existing Recruiter Manager group configuration...');
      recruiterManagerGroup = existingRecruiterManagerGroup;
    } else {
      console.log('   Creating new Recruiter Manager group...');
      recruiterManagerGroup = await prisma.userGroup.create({
        data: {
          name: 'Recruiter Manager',
          description: 'Lead recruiter with advanced access',
          permissions: [
            // applicant management
                        'applicantS_VIEW', 'applicantS_VIEW_ALL', 'applicantS_VIEW_DETAILED', 'applicantS_CREATE', 'applicantS_EDIT_BASIC', 'applicantS_EDIT_SENSITIVE', 'applicantS_EDIT_BASIC_ALL', 'applicantS_EDIT_SENSITIVE_ALL', 'applicantS_SOURCE_ASSIGN', 'applicantS_SOURCE_ASSIGN_BULK', 'applicantS_RECRUITER_ASSIGN', 'applicantS_RECRUITER_ASSIGN_BULK', 'applicantS_RECRUITER_ASSIGN_ALL', 'applicantS_PIPELINE_STAGE_UPDATE', 'applicantS_PIPELINE_STAGE_BULK_UPDATE', 'applicantS_PIPELINE_STAGE_UPDATE_ALL', 'applicantS_RESUMES_UPLOAD', 'applicantS_RESUMES_UPLOAD_ALL', 'applicantS_RESUMES_DELETE', 'applicantS_COMMENTS_VIEW', 'applicantS_COMMENTS_ADD', 'applicantS_COMMENTS_ADD_ALL', 'applicantS_COMMENTS_EDIT', 'applicantS_IMPORT', 'applicantS_EXPORT', 'applicantS_ACTIVITIES_VIEW',
            // Position management
            'POSITIONS_VIEW', 'POSITIONS_VIEW_ALL', 'POSITIONS_CREATE', 'POSITIONS_EDIT_BASIC', 'POSITIONS_EDIT_DETAILED', 'POSITIONS_RECRUITER_ASSIGN', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT',
            // Other permissions
            'TASK_BOARD_VIEW', 'TASK_BOARD_MANAGE_ALL', 'RECRUITMENT_STAGES_VIEW', 'USER_PREFERENCES_MANAGE_OWN', 'USER_PREFERENCES_MANAGE_ALL', 'BULK_UPLOAD_EXECUTE', 'DASHBOARD_VIEW', 'REPORTS_GENERATE', 'WEBHOOK_ANALYTICS_VIEW', 'FRIEND_REFERRALS_ACCESS'
          ],
          isDefault: false,
          isSystemRole: false,
        }
      });
    }

    // Create or update hiring manager group
    let hiringManagerGroup;
    if (existingHiringManagerGroup) {
      console.log('   Preserving existing Hiring Managers group configuration...');
      hiringManagerGroup = existingHiringManagerGroup;
    } else {
      console.log('   Creating new Hiring Managers group...');
      hiringManagerGroup = await prisma.userGroup.create({
        data: {
          name: 'Hiring Manager',
          description: 'View-only access for hiring decisions',
          permissions: [
            'applicantS_VIEW', 'applicantS_VIEW_DETAILED', 'applicantS_COMMENTS_VIEW_REMARK_ONLY', 'POSITIONS_VIEW', 'TASK_BOARD_VIEW', 'DASHBOARD_VIEW', 'USER_PREFERENCES_MANAGE_OWN', 'FRIEND_REFERRALS_ACCESS'
          ],
          isDefault: false,
          isSystemRole: false,
        }
      });
    }

    // Create or update employee self-service group
    if (existingEmployeeGroup) {
      console.log('   Syncing existing Employee group permissions...');
      await prisma.userGroup.update({
        where: { id: existingEmployeeGroup.id },
        data: {
          description: 'Employee self-service access',
          permissions: ['USER_PREFERENCES_MANAGE_OWN', 'FRIEND_REFERRALS_ACCESS'],
          isDefault: false,
          isSystemRole: true,
        }
      });
    } else {
      console.log('   Creating new Employee group...');
      await prisma.userGroup.create({
        data: {
          id: '00000000-0000-0000-0000-000000000005',
          name: 'Employee',
          description: 'Employee self-service access',
          permissions: ['USER_PREFERENCES_MANAGE_OWN', 'FRIEND_REFERRALS_ACCESS'],
          isDefault: false,
          isSystemRole: true,
        }
      });
    }

    // Create or update pre-registered user group
    let preRegisteredGroup;
    if (existingPreRegisteredGroup) {
      console.log('   Preserving existing Pre-Registered User group configuration...');
      preRegisteredGroup = existingPreRegisteredGroup;
    } else {
      console.log('   Creating new Pre-Registered User group...');
      preRegisteredGroup = await prisma.userGroup.create({
        data: {
          id: '00000000-0000-0000-0000-000000000004',
          name: 'Pre-Registered User',
          description: 'Minimal permissions for pre-registered AD users - login and view own profile only',
          permissions: [
            'USER_PREFERENCES_MANAGE_OWN', 'ROLES_MANAGE', 'FRIEND_REFERRALS_ACCESS'
          ],
          isDefault: false,
          isSystemRole: true,
        }
      });
    }

    console.log('✓ Default user groups created/updated');

    // Assign admin user to Administrators group
    console.log('Assigning admin user to Administrators group...');
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (adminUser) {
      if (!adminUser.userGroupId) {
        // Only assign the default admin group when the user has no explicit group yet.
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { userGroupId: adminGroup.id }
        });
        console.log('✓ Admin user assigned to Administrators group');
      } else {
        console.log('   Preserving existing admin user group assignment...');
      }
    }

    // Create basic system settings
    console.log('Creating system settings...');

    const defaultEmailTemplate = buildSeedTemplateHtml(
      'Interview Invitation',
      'You have been invited to interview {{ApplicantName}} for the position of {{positionTitle}}.',
      '<p>Please use the link below to evaluate the candidate:</p><p style="text-align: center;"><a href="{{evaluationLink}}" style="display:inline-block;padding:12px 24px;background:#3B82F6;color:#ffffff;text-decoration:none;border-radius:5px;margin:12px 0;">Evaluate applicant</a></p><p>Please confirm your attendance and let us know if you need to reschedule.</p>',
    );

    const emailTemplateRequirements = [
      ['application_received', 'Application received', 'Recruitment'],
      ['new_application_alert', 'New application alert', 'Recruitment'],
      ['applicant_status_changed', 'Applicant status changed', 'Recruitment'],
      ['candidate_shortlisted', 'Candidate shortlisted', 'Recruitment'],
      ['interview_invitation', 'Interview invitation', 'Interview'],
      ['interview_rescheduled', 'Interview rescheduled', 'Interview'],
      ['interview_cancelled', 'Interview cancelled', 'Interview'],
      ['offer_letter', 'Offer letter', 'Offer'],
      ['offer_reminder', 'Offer reminder', 'Offer'],
      ['employee_password_setup', 'Employee password setup', 'Onboarding'],
      ['onboarding_invitation', 'Onboarding invitation', 'Onboarding'],
      ['onboarding_task_reminder', 'Onboarding task reminder', 'Onboarding'],
      ['document_issued', 'Employee document issued', 'Employee'],
      ['document_expiry_reminder', 'Document expiry reminder', 'Employee'],
      ['employee_profile_update_required', 'Profile update required', 'Employee'],
      ['employee_survey_invitation', 'Employee survey invitation', 'Survey'],
      ['employee_survey_reminder', 'Employee survey reminder', 'Survey'],
      ['employee_survey_completed', 'Survey completion confirmation', 'Survey'],
      ['leave_status_changed', 'Leave request status', 'Leave'],
      ['leave_balance_warning', 'Leave balance warning', 'Leave'],
      ['attendance_exception', 'Attendance exception', 'Attendance'],
      ['timesheet_submission_reminder', 'Timesheet submission reminder', 'Attendance'],
      ['timesheet_status_changed', 'Timesheet status changed', 'Attendance'],
      ['shift_schedule_published', 'Shift schedule published', 'Attendance'],
      ['shift_schedule_changed', 'Shift schedule changed', 'Attendance'],
      ['payslip_available', 'Payslip available', 'Payroll'],
      ['payroll_information_required', 'Payroll information required', 'Payroll'],
      ['performance_review_assigned', 'Performance review assigned', 'Performance'],
      ['performance_review_reminder', 'Performance review reminder', 'Performance'],
      ['performance_review_completed', 'Performance review completed', 'Performance'],
      ['goal_checkin_reminder', 'Goal check-in reminder', 'Performance'],
      ['training_assigned', 'Training assigned', 'Learning'],
      ['training_due_reminder', 'Training due reminder', 'Learning'],
      ['training_completed', 'Training completion', 'Learning'],
      ['expense_status_changed', 'Expense request status', 'Expenses'],
      ['company_announcement', 'Company announcement', 'Communication'],
      ['policy_acknowledgement_required', 'Policy acknowledgement required', 'Communication'],
      ['resignation_acknowledged', 'Resignation acknowledged', 'Offboarding'],
      ['exit_interview_invitation', 'Exit interview invitation', 'Offboarding'],
      ['offboarding_task_reminder', 'Offboarding task reminder', 'Offboarding'],
      ['termination_notice', 'Termination notice', 'Offboarding'],
      ['email_verification_code', 'Email verification code', 'System'],
      ['account_locked_alert', 'Account locked alert', 'System'],
    ].map(([code, name, category]) => ({ code, name, category, required: true }));

    const systemSettings = [
      { key: 'appName', value: 'hrive' },
      { key: 'appThemePreference', value: 'system' },
      { key: 'primaryGradientStart', value: '220 78% 28%' },
      { key: 'primaryGradientEnd', value: '222 72% 36%' },
      { key: 'loginPageLayoutType', value: '2column' },
      { key: 'loginPageLogoSize', value: '100' },
      { key: 'sidebarNavigationMode', value: 'single' },
      { key: 'sidebarSecondaryGroupLabels', value: '[]' },
      { key: 'hiringManagerRestrictToAssignedPositions', value: 'true' },
      { key: 'emailTemplateRequirements', value: JSON.stringify(emailTemplateRequirements) },
      { key: 'emailTemplateCatalog', value: JSON.stringify(createSeededEmailTemplateCatalog()) },
      { key: 'documentTemplates', value: JSON.stringify(createSeededDocumentTemplates()) },
    ];

    // Add email template settings
    systemSettings.push(
      {
        key: 'emailTemplateInterviewInvitationSubject',
        value: 'Interview Invitation: {{ApplicantName}} - {{positionTitle}}'
      },
      {
        key: 'emailTemplateInterviewInvitation',
        value: defaultEmailTemplate
      },
      {
        key: 'interviewInvitationFeatureEnabled',
        value: 'true'
      }
    );

    const existingSettings = await prisma.systemSetting.findMany({
      where: { key: { in: systemSettings.map(s => s.key) } }
    });
    const existingByKey = new Map(existingSettings.map(s => [s.key, s]));

    for (const setting of systemSettings) {
      const existing = existingByKey.get(setting.key as any);

      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {}, // Don't reset value if exists
        create: setting
      });
    }
    console.log('✓ System settings created/updated');

    console.log('System prompt categories are loaded on demand from AppKit.');
    console.log('App logo, default match criteria, and applicant evaluation prompt are loaded on demand from AppKit.');

    console.log('Grades, Applicant sources, and position levels are loaded on demand from AppKit.');

    console.log('\nDatabase Seeding: COMPLETED');
    console.log('Status: All systems operational');
  } catch (error) {
    console.error('ERROR: Database seeding failed:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('ERROR: Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
