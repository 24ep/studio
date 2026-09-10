import type React from 'react';

import type { ApplicantSource, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantSettings } from './applicant-settings-types';

export interface ApplicantsPageModalsProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  availableStages: RecruitmentStage[];
  availableSources: ApplicantSource[];
  onApplicantCreated: () => Promise<void>;

  isBulkUploadModalOpen: boolean;
  setIsBulkUploadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onBulkUploadSuccess: () => Promise<void>;

  isImportModalOpen: boolean;
  setIsImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onImportSuccess: () => Promise<void>;

  isPositionDrawerOpen: boolean;
  setIsPositionDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPositionForEdit: Position | null;

  isSettingsDrawerOpen: boolean;
  setIsSettingsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  applicantSettings: ApplicantSettings | null;
  onSettingsChange: (settings: ApplicantSettings) => Promise<void>;
  settingsLoading: boolean;
  settingsError: string | null;
  clearSettingsError: () => void;

  isBulkStatusModalOpen: boolean;
  setIsBulkStatusModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bulkNewStatus: string;
  setBulkNewStatus: React.Dispatch<React.SetStateAction<string>>;
  bulkTransitionNotes: string;
  setBulkTransitionNotes: React.Dispatch<React.SetStateAction<string>>;
  selectedApplicantIds: Set<string>;
  handleBulkChangeStatus: (applicantIds: string[], newStatus: string, notes?: string) => Promise<void>;
  availableStagesForBulk: RecruitmentStage[];

  isBulkRecruiterModalOpen: boolean;
  setIsBulkRecruiterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bulkNewRecruiterId: string | null;
  setBulkNewRecruiterId: React.Dispatch<React.SetStateAction<string | null>>;
  handleBulkAssignRecruiter: (applicantIds: string[], recruiterId: string | null) => Promise<void>;
  availableRecruiter: Array<{ id: string; name: string; avatarUrl?: string | null; personalColor?: string | null }>;
}
