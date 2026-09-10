import type { Applicant, ApplicantSource, ApplicantStatus, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';
import type { ApplicantGroupBy } from './applicant-settings-types';

export interface ApplicantTableProps {
  applicants: Applicant[];
  allPinnedApplicants?: Applicant[];
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: { id: string; name: string }[];
  availableSources: ApplicantSource[];
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onAssignSource?: (applicantId: string, sourceId: string | null, subSource?: string | null) => void;
  onUpdateApplicant: (applicantId: string, status: ApplicantStatus, notes?: string, suppressToast?: boolean) => Promise<void>;
  onDeleteApplicant: (applicantId: string) => Promise<void>;
  onEditPosition: (position: Position) => void;
  isLoading?: boolean;
  onRefreshApplicantData: (applicantId: string) => Promise<void>;
  selectedApplicantIds?: Set<string>;
  onToggleSelectApplicant: (applicantId: string) => void;
  onToggleSelectAllApplicants: () => void;
  isAllApplicantsSelected: boolean;
  page?: number;
  pageSize?: number;
  baseIndex?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | null;
  groupBy?: ApplicantGroupBy;
  onSort?: (column: string | null, direction?: 'asc' | 'desc' | null) => void;
  canManageApplicants?: boolean;
  canEditApplicants?: boolean;
  canDeleteApplicants?: boolean;
  canChangeStatus?: boolean;
  canViewDetailed?: boolean;
  canAssignSource?: boolean;
  canAssignRecruiter?: boolean;
  settings?: ApplicantSettings;
  tableHeight?: number;
  onBulkDelete?: (applicantIds: string[]) => Promise<void>;
  onBulkChangeStatus?: (applicantIds: string[], newStatus: string, notes?: string) => Promise<void>;
  onBulkAssignRecruiter?: (applicantIds: string[], recruiterId: string | null) => Promise<void>;
  onBulkReprocess?: (applicantIds: string[]) => Promise<void>;
}

export type ApplicantTableSelectedSummary = Partial<Applicant> & {
  id: string;
  name: string;
};
