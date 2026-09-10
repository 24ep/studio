import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const EVALUATION_LINKS_PLATFORM_MODULES: PlatformModule[] = [
  // ===== EVALUATION LINKS =====

  {
    id: 'EVALUATION_LINKS_VIEW',
    label: 'View Evaluation Links',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View evaluation links for Applicants",
    detailedDescription: "Access to view evaluation links including URL, expiration date, and owner information. Cannot create or modify links.",
    impact: "Read-only access to evaluation links. No ability to create or modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'EVALUATION_LINKS_CREATE_OWN',
    label: 'Create Evaluation Links (Own Assigned)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Create evaluation links for Applicants assigned to you",
    detailedDescription: "Ability to create evaluation links only for Applicants assigned to you as recruiter. Can set expiration and login requirements.",
    impact: "Limited to own assigned Applicants. Medium risk as controls access to Applicant evaluation.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'EVALUATION_LINKS_CREATE_ALL',
    label: 'Create Evaluation Links (All Applicants)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Create evaluation links for any Applicant",
    detailedDescription: "Ability to create evaluation links for any Applicant in the system, regardless of assignment. Can set expiration and login requirements.",
    impact: "Full access to create evaluation links. High risk as controls access to all Applicant evaluations.",
    riskLevel: 'HIGH'
  },

  {
    id: 'EVALUATION_LINKS_MANAGE_OWN',
    label: 'Manage Evaluation Links (Own Created)',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Manage evaluation links created by you",
    detailedDescription: "Ability to update, extend, or revoke evaluation links that you created. Can modify expiration dates and login requirements.",
    impact: "Limited to own created links. Medium risk as controls access to Applicant evaluation.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'EVALUATION_LINKS_MANAGE_ALL',
    label: 'Manage All Evaluation Links',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Manage all evaluation links in the system",
    detailedDescription: "Ability to update, extend, or revoke any evaluation link in the system, regardless of creator. Can modify expiration dates and login requirements.",
    impact: "Full access to manage all evaluation links. High risk as controls access to all Applicant evaluations.",
    riskLevel: 'HIGH'
  },
];
