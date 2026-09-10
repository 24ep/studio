import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const COMPANY_PORTAL_PLATFORM_MODULES: PlatformModule[] = [
  {
    id: 'COMPANY_PORTAL_VIEW',
    label: 'View Job Portal',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: 'View the standalone job portal, CMS pages, assets, and publish history.',
    detailedDescription: 'Allows access to the job portal no-code CMS workspace and public job-site release records.',
    impact: 'Read-only access to job portal configuration and content.',
    riskLevel: 'LOW',
  },
  {
    id: 'COMPANY_PORTAL_MANAGE',
    label: 'Manage Job Portal',
    category: PLATFORM_MODULE_CATEGORIES.SYSTEM_CONFIGURATION,
    description: 'Create, edit, and publish job portal website content.',
    detailedDescription: 'Allows operators to modify static website pages, builder blocks, CMS assets, and publishing workflow.',
    impact: 'Can change candidate-facing job portal content and its published site structure.',
    riskLevel: 'HIGH',
    requiresApproval: true,
  },
];
