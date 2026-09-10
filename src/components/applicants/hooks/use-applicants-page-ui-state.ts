import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Position } from '@/lib/types';
import type { ApplicantSettings } from '../applicant-settings-types';
import {
  buildApplicantGroupBySettings,
  buildApplicantPageSizeSettings,
  buildApplicantSortSettings,
} from '../applicant-page-utils';
import type { ApplicantGroupBy } from '../applicant-settings-types';

interface UseApplicantsPageUiStateInput {
  applicantSettings: ApplicantSettings;
  setApplicantSettings: (settings: ApplicantSettings) => Promise<void>;
  setPage: Dispatch<SetStateAction<number>>;
}

export function useApplicantsPageUiState({
  applicantSettings,
  setApplicantSettings,
  setPage,
}: UseApplicantsPageUiStateInput) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);
  const [selectedPositionForEdit, setSelectedPositionForEdit] = useState<Position | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileFilterModalOpen, setIsMobileFilterModalOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isBulkRecruiterModalOpen, setIsBulkRecruiterModalOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState('');
  const [bulkNewRecruiterId, setBulkNewRecruiterId] = useState<string | null>(null);
  const [bulkTransitionNotes, setBulkTransitionNotes] = useState('');

  const handleSettingsChange = useCallback(async (settings: ApplicantSettings) => {
    await setApplicantSettings(settings);
  }, [setApplicantSettings]);

  const handlePageSizeChange = useCallback(async (newPageSize: number) => {
    await setApplicantSettings(buildApplicantPageSizeSettings(applicantSettings, newPageSize));
    setPage(1);
  }, [applicantSettings, setApplicantSettings, setPage]);

  const handleSortChange = useCallback(async (column: string | null, direction?: 'asc' | 'desc' | null) => {
    await setApplicantSettings(buildApplicantSortSettings(applicantSettings, column, direction));
  }, [applicantSettings, setApplicantSettings]);

  const handleGroupByChange = useCallback(async (groupBy: ApplicantGroupBy) => {
    await setApplicantSettings(buildApplicantGroupBySettings(applicantSettings, groupBy));
  }, [applicantSettings, setApplicantSettings]);

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    isPositionDrawerOpen,
    setIsPositionDrawerOpen,
    selectedPositionForEdit,
    setSelectedPositionForEdit,
    isBulkUploadModalOpen,
    setIsBulkUploadModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isMobileFilterModalOpen,
    setIsMobileFilterModalOpen,
    isSettingsDrawerOpen,
    setIsSettingsDrawerOpen,
    isBulkStatusModalOpen,
    setIsBulkStatusModalOpen,
    isBulkRecruiterModalOpen,
    setIsBulkRecruiterModalOpen,
    bulkNewStatus,
    setBulkNewStatus,
    bulkNewRecruiterId,
    setBulkNewRecruiterId,
    bulkTransitionNotes,
    setBulkTransitionNotes,
    handleSettingsChange,
    handlePageSizeChange,
    handleSortChange,
    handleGroupByChange,
  };
}
