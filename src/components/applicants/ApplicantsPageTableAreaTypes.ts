import type React from 'react';
import type { Applicant, ApplicantFilterValues, ApplicantSource, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';
import type { ApplicantGroupBy } from './applicant-settings-types';

export interface ApplicantsPageTableAreaProps {
  applicantsToRender: Applicant[];
  allPinnedApplicants: Applicant[];
  displayedApplicants: Applicant[];
  isLoading: boolean;
  tableLoading: boolean;
  updateApplicantStatus: (applicantId: string, status: string, notes?: string, suppressToast?: boolean) => Promise<void>;
  handleDeleteApplicant: (applicantId: string) => Promise<void>;
  handleAssignRecruiter: (applicantId: string, recruiterId: string | null) => Promise<void>;
  handleAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => Promise<void>;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Array<{ id: string; name: string }>;
  availableSources: ApplicantSource[];
  canEditApplicants: boolean;
  canDeleteApplicants: boolean;
  canChangeStatus: boolean;
  canBulkChangeStatus: boolean;
  canViewDetailed: boolean;
  canAssignSource: boolean;
  canAssignRecruiter: boolean;
  sortColumn: string;
  sortDirection: 'asc' | 'desc' | null;
  groupBy: ApplicantGroupBy;
  handleSortChange: (column: string | null, direction?: 'asc' | 'desc' | null) => Promise<void>;
  handleGroupByChange: (groupBy: ApplicantGroupBy) => Promise<void>;
  setSelectedPositionForEdit: (position: Position | null) => void;
  refreshApplicantInList: (
    applicantId: string,
    fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>,
    filters: ApplicantFilterValues,
    page: number,
    pageSize: number,
    aiMatchedApplicantIds: string[] | null
  ) => Promise<void>;
  fetchAllPinnedApplicants: () => Promise<void>;
  selectedApplicantIds: Set<string>;
  setSelectedApplicantIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleBulkDelete: (applicantIds: string[]) => Promise<void>;
  handleBulkChangeStatus: (applicantIds: string[], newStatus: string, notes?: string) => Promise<void>;
  handleBulkAssignRecruiter: (applicantIds: string[], recruiterId: string | null) => Promise<void>;
  handleBulkReprocess: (applicantIds: string[]) => Promise<void>;
  setBulkNewStatus: React.Dispatch<React.SetStateAction<string>>;
  setBulkTransitionNotes: React.Dispatch<React.SetStateAction<string>>;
  setIsBulkStatusModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setBulkNewRecruiterId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsBulkRecruiterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  applicantSettings: ApplicantSettings | null;
  tableHeight: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  handlePageSizeChange: (newPageSize: number) => Promise<void>;
  total: number;
  totalPages: number;
  isAiSearchActive: boolean;
  aiMatchedApplicantIds: string[] | null;
  aiRecordCount: number;
  filters: ApplicantFilterValues;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => Promise<void>;
  aiMatchedApplicantIdsForRefresh: string[] | null;
}
