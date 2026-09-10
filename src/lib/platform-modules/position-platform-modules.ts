import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const POSITION_PLATFORM_MODULES: PlatformModule[] = [
  // ===== POSITION MANAGEMENT =====

  {
    id: 'POSITIONS_VIEW',
    label: 'View Job Positions',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "View job position details and lists",
    detailedDescription: "Access to view job position information including title, department, requirements, and status.",
    impact: "Read-only access to position data. No ability to modify.",
    riskLevel: 'LOW'
  },

  {
    id: 'POSITIONS_VIEW_ALL',
    label: 'View All Job Positions (Unrestricted)',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "View all job positions regardless of interviewer assignment",
    detailedDescription: "For hiring managers: allows viewing all positions in the system, not just those where the user is assigned as an interviewer. Overrides the system-wide restriction setting.",
    impact: "Can view all positions regardless of assignment. Important for senior hiring managers who need oversight.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'POSITIONS_CREATE',
    label: 'Create Job Positions',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Create new job positions in the system",
    detailedDescription: "Ability to create new job positions, define requirements, set salary ranges, and configure recruitment parameters.",
    impact: "Can create new recruitment opportunities. Affects hiring strategy and resource allocation.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'POSITIONS_EDIT_BASIC',
    label: 'Edit Basic Position Information',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Edit basic position details like title, department, location",
    detailedDescription: "Ability to edit basic job position information such as title, department, location, and general description. Cannot modify critical recruitment parameters.",
    impact: "Can update basic position information. Limited risk to recruitment process.",
    riskLevel: 'LOW'
  },

  {
    id: 'POSITIONS_EDIT_DETAILED',
    label: 'Edit Detailed Position Information',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Edit detailed position requirements and parameters",
    detailedDescription: "Ability to edit detailed job position information including requirements, salary ranges, status, and recruitment parameters.",
    impact: "Can modify recruitment requirements and parameters. Affects Applicant matching and hiring process.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'POSITIONS_RECRUITER_ASSIGN',
    label: 'Assign Recruiter to Positions',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Assign and change recruiters responsible for positions",
    detailedDescription: "Ability to assign and reassign recruiters to specific job positions. Controls responsibility and workload distribution.",
    impact: "Affects recruiter workload and position ownership. Important for team management.",
    riskLevel: 'MEDIUM'
  },

  {
    id: 'POSITIONS_DELETE',
    label: 'Delete Job Positions',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Remove job positions from the system",
    detailedDescription: "Ability to delete job positions and all associated data. Affects active recruitment campaigns.",
    impact: "Can terminate recruitment campaigns. Affects active Applicants and hiring plans.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'POSITIONS_IMPORT',
    label: 'Import Position Data',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Bulk import job position data",
    detailedDescription: "Ability to import job position data from external sources. Can create multiple positions at once.",
    impact: "Can add large volumes of position data quickly. Risk of data quality issues.",
    riskLevel: 'HIGH',
    requiresApproval: true
  },

  {
    id: 'POSITIONS_EXPORT',
    label: 'Export Position Data',
    category: PLATFORM_MODULE_CATEGORIES.POSITION_MANAGEMENT,
    description: "Export job position data",
    detailedDescription: "Ability to export job position data to external formats for reporting and analysis.",
    impact: "Data can be taken outside the system. Important for data security.",
    riskLevel: 'LOW'
  },

];
