const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// All permissions from PLATFORM_MODULES in src/lib/types.ts
const ALL_PERMISSIONS = [
  // applicant Management
  'applicantS_VIEW',
  'applicantS_VIEW_DETAILED',
  'applicantS_CREATE',
  'applicantS_EDIT_BASIC',
  'applicantS_EDIT_SENSITIVE',
  'applicantS_EDIT_BASIC_OWN',
  'applicantS_EDIT_SENSITIVE_OWN',
  'applicantS_EDIT_BASIC_ALL',
  'applicantS_EDIT_SENSITIVE_ALL',
  'applicantS_DELETE',
  'applicantS_SOURCE_ASSIGN',
  'applicantS_SOURCE_ASSIGN_BULK',
  'applicantS_RECRUITER_ASSIGN',
  'applicantS_RECRUITER_ASSIGN_OWN',
  'applicantS_RECRUITER_ASSIGN_ALL',
  'applicantS_RECRUITER_ASSIGN_BULK',
  'applicantS_PIPELINE_STAGE_UPDATE',
  'applicantS_PIPELINE_STAGE_UPDATE_OWN',
  'applicantS_PIPELINE_STAGE_UPDATE_ALL',
  'applicantS_PIPELINE_STAGE_BULK_UPDATE',
  'applicantS_RESUMES_UPLOAD',
  'applicantS_RESUMES_UPLOAD_OWN',
  'applicantS_RESUMES_UPLOAD_ALL',
  'applicantS_RESUMES_DELETE',
  'applicantS_COMMENTS_VIEW',
  'applicantS_COMMENTS_ADD',
  'applicantS_COMMENTS_ADD_OWN',
  'applicantS_COMMENTS_ADD_ALL',
  'applicantS_COMMENTS_EDIT',
  'applicantS_IMPORT',
  'applicantS_EXPORT',
  
  // Position Management
  'POSITIONS_VIEW',
  'POSITIONS_CREATE',
  'POSITIONS_EDIT_BASIC',
  'POSITIONS_EDIT_DETAILED',
  'POSITIONS_RECRUITER_ASSIGN',
  'POSITIONS_DELETE',
  'POSITIONS_IMPORT',
  'POSITIONS_EXPORT',
  
  // User Access Control
  'USERS_VIEW',
  'USERS_CREATE',
  'USERS_EDIT',
  'USERS_DELETE',
  'USERS_PERMISSIONS_MANAGE',
  'USER_GROUPS_VIEW',
  'USER_GROUPS_CREATE',
  'USER_GROUPS_EDIT',
  'USER_GROUPS_DELETE',
  
  // System Configuration
  'SYSTEM_SETTINGS_VIEW',
  'SYSTEM_SETTINGS_EDIT',
  'RECRUITMENT_STAGES_VIEW',
  'RECRUITMENT_STAGES_EDIT',
  'CUSTOM_FIELDS_VIEW',
  'CUSTOM_FIELDS_EDIT',
  
  // Automation & Integration
  'WEBHOOKS_VIEW',
  'WEBHOOKS_EDIT',
  'AI_INTEGRATION_VIEW',
  'AI_INTEGRATION_EDIT',
  'UPLOAD_QUEUE_VIEW',
  'UPLOAD_QUEUE_MANAGE',
  'BULK_UPLOAD_EXECUTE',
  
  // Analytics & Reporting
  'DASHBOARD_VIEW',
  'REPORTS_GENERATE',
  'WEBHOOK_ANALYTICS_VIEW',
  
  // Logging & Audit
  'LOGS_VIEW',
  'LOGS_EXPORT',
  'APP_PERFORMANCE_VIEW',
  
  // Task Management
  'TASK_BOARD_VIEW',
  'TASK_BOARD_MANAGE_OWN',
  'TASK_BOARD_MANAGE_ALL',
  
  // Job Matching
  'JOB_MATCH_VIEW',
  'JOB_MATCH_MANAGE',
  
  // Warning System
  'WARNING_CONFIGURATIONS_VIEW',
  'WARNING_CONFIGURATIONS_MANAGE',
  
  // User Preferences
  'USER_PREFERENCES_MANAGE_OWN',
  'USER_PREFERENCES_MANAGE_ALL',
];

async function verifyAdminPermissions() {
  console.log('Verifying Admin Role Permissions...\n');
  
  try {
    // Get Admin user group
    const adminGroup = await prisma.userGroup.findUnique({
      where: { name: 'Admin' }
    });
    
    if (!adminGroup) {
      console.log('Admin user group not found!');
      return;
    }
    
    console.log(`Found Admin group: ${adminGroup.name}`);
    console.log(`Current permissions count: ${adminGroup.permissions.length}`);
    console.log(`Total system permissions: ${ALL_PERMISSIONS.length}\n`);
    
    // Check for missing permissions
    const adminPermissions = new Set(adminGroup.permissions);
    const allPermissionsSet = new Set(ALL_PERMISSIONS);
    const missingPermissions = ALL_PERMISSIONS.filter(p => !adminPermissions.has(p));
    const extraPermissions = adminGroup.permissions.filter(p => !allPermissionsSet.has(p));
    
    if (missingPermissions.length > 0) {
      console.log('MISSING PERMISSIONS:');
      missingPermissions.forEach(perm => {
        console.log(`   - ${perm}`);
      });
      console.log('');
    } else {
      console.log('All system permissions are assigned to Admin role!\n');
    }
    
    if (extraPermissions.length > 0) {
      console.log('EXTRA PERMISSIONS (not in system definition):');
      extraPermissions.forEach(perm => {
        console.log(`   - ${perm}`);
      });
      console.log('');
    }
    
    // Summary
    console.log('Summary:');
    console.log(`   Total system permissions: ${ALL_PERMISSIONS.length}`);
    console.log(`   Admin has: ${adminGroup.permissions.length}`);
    console.log(`   Missing: ${missingPermissions.length}`);
    console.log(`   Extra: ${extraPermissions.length}`);
    
    if (missingPermissions.length > 0) {
      console.log('\nACTION REQUIRED: Update Admin role to include missing permissions.');
      return { missing: missingPermissions, extra: extraPermissions };
    } else {
      console.log('\nAdmin role has all required permissions!');
      return { missing: [], extra: extraPermissions };
    }
    
  } catch (error) {
    console.error('Error verifying permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminPermissions()
  .then(result => {
    if (result && result.missing.length > 0) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

