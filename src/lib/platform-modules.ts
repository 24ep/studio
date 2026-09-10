import { ANALYTICS_REPORTING_PLATFORM_MODULES } from './platform-modules/analytics-reporting-platform-modules';
import { APPLICANT_PLATFORM_MODULES } from './platform-modules/applicant-platform-modules';
import { AUTOMATION_INTEGRATION_PLATFORM_MODULES } from './platform-modules/automation-integration-platform-modules';
import { COMPANY_PORTAL_PLATFORM_MODULES } from './platform-modules/company-portal-platform-modules';
import { EVALUATION_LINKS_PLATFORM_MODULES } from './platform-modules/evaluation-links-platform-modules';
import { JOB_MATCHING_PLATFORM_MODULES } from './platform-modules/job-matching-platform-modules';
import { LOGGING_AUDIT_PLATFORM_MODULES } from './platform-modules/logging-audit-platform-modules';
import { POSITION_PLATFORM_MODULES } from './platform-modules/position-platform-modules';
import { SYSTEM_CONFIGURATION_PLATFORM_MODULES } from './platform-modules/system-configuration-platform-modules';
import { TASK_PLATFORM_MODULES } from './platform-modules/task-platform-modules';
import { USER_ACCESS_PLATFORM_MODULES } from './platform-modules/user-access-platform-modules';
import { USER_PREFERENCES_PLATFORM_MODULES } from './platform-modules/user-preferences-platform-modules';
import { HR_PLATFORM_MODULES } from './platform-modules/hr-platform-modules';
import { EXPENSE_PLATFORM_MODULES } from './platform-modules/expense-platform-modules';
import type { PlatformModule } from './platform-modules/platform-module-types';

export { PLATFORM_MODULE_CATEGORIES } from './platform-modules/platform-module-types';
export type { PlatformModule, PlatformModuleCategory, PlatformModuleId } from './platform-modules/platform-module-types';

export const PLATFORM_MODULES: PlatformModule[] = [
  ...APPLICANT_PLATFORM_MODULES,
  ...POSITION_PLATFORM_MODULES,
  ...USER_ACCESS_PLATFORM_MODULES,
  ...SYSTEM_CONFIGURATION_PLATFORM_MODULES,
  ...AUTOMATION_INTEGRATION_PLATFORM_MODULES,
  ...ANALYTICS_REPORTING_PLATFORM_MODULES,
  ...LOGGING_AUDIT_PLATFORM_MODULES,
  ...TASK_PLATFORM_MODULES,
  ...JOB_MATCHING_PLATFORM_MODULES,
  ...USER_PREFERENCES_PLATFORM_MODULES,
  ...COMPANY_PORTAL_PLATFORM_MODULES,
  ...EVALUATION_LINKS_PLATFORM_MODULES,
  ...HR_PLATFORM_MODULES,
  ...EXPENSE_PLATFORM_MODULES,
];
