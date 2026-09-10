import { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { UseFormSetValue } from 'react-hook-form';
import type { Applicant } from '@/lib/types';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  updateJobAppliedRecruiter,
  updateJobAppliedSalary,
  updateJobAppliedSource,
  updateJobAppliedStatus,
} from './job-applied-tab-api';
import {
  getInitialJobAppliedEditState,
  parseExpectedSalaryInput,
  runJobAppliedDialogUpdate,
  toNullableJobAppliedId,
} from './job-applied-tab-utils';

export function useJobAppliedTabController({
  applicant,
  onRefresh,
  setValue,
}: {
  applicant: Applicant;
  onRefresh?: () => void;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
}) {
  const initialEditState = getInitialJobAppliedEditState(applicant);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [isEditRecruiterOpen, setIsEditRecruiterOpen] = useState(false);
  const [isEditSourceOpen, setIsEditSourceOpen] = useState(false);
  const [isEditSalaryOpen, setIsEditSalaryOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(initialEditState.status);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(initialEditState.recruiterId);
  const [selectedSourceId, setSelectedSourceId] = useState(initialEditState.sourceId);
  const [selectedSalary, setSelectedSalary] = useState(initialEditState.salary);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    await runJobAppliedDialogUpdate({
      update: () => updateJobAppliedStatus({ applicantId: applicant.id, status: selectedStatus }),
      setIsUpdating,
      updateFormValue: () => setValue?.('status', selectedStatus),
      closeDialog: () => setIsEditStatusOpen(false),
      onRefresh,
      showSuccess: toast.success,
      showError: toast.error,
      successMessage: 'Status updated successfully',
      fallbackErrorMessage: 'Failed to update status',
    });
  };

  const handleUpdateRecruiter = async () => {
    const recruiterId = toNullableJobAppliedId(selectedRecruiterId);
    await runJobAppliedDialogUpdate({
      update: () => updateJobAppliedRecruiter({ applicantId: applicant.id, recruiterId }),
      setIsUpdating,
      updateFormValue: () => setValue?.('recruiterId', recruiterId),
      closeDialog: () => setIsEditRecruiterOpen(false),
      onRefresh,
      showSuccess: toast.success,
      showError: toast.error,
      successMessage: 'Recruiter updated successfully',
      fallbackErrorMessage: 'Failed to update recruiter',
    });
  };

  const handleUpdateSource = async () => {
    const sourceId = toNullableJobAppliedId(selectedSourceId);
    await runJobAppliedDialogUpdate({
      update: () => updateJobAppliedSource({ applicantId: applicant.id, sourceId }),
      setIsUpdating,
      updateFormValue: () => setValue?.('sourceId', sourceId),
      closeDialog: () => setIsEditSourceOpen(false),
      onRefresh,
      showSuccess: toast.success,
      showError: toast.error,
      successMessage: 'Source updated successfully',
      fallbackErrorMessage: 'Failed to update source',
    });
  };

  const handleUpdateSalary = async () => {
    const salaryValue = parseExpectedSalaryInput(selectedSalary);
    await runJobAppliedDialogUpdate({
      update: () => updateJobAppliedSalary({ applicantId: applicant.id, expectedSalary: salaryValue }),
      setIsUpdating,
      updateFormValue: () => setValue?.('expectedSalary', salaryValue),
      closeDialog: () => setIsEditSalaryOpen(false),
      onRefresh,
      showSuccess: toast.success,
      showError: toast.error,
      successMessage: 'Applicant updated successfully',
      fallbackErrorMessage: 'Failed to update salary',
    });
  };

  return {
    handleUpdateRecruiter,
    handleUpdateSalary,
    handleUpdateSource,
    handleUpdateStatus,
    isEditRecruiterOpen,
    isEditSalaryOpen,
    isEditSourceOpen,
    isEditStatusOpen,
    isUpdating,
    openRecruiterDialog: () => {
      setSelectedRecruiterId(applicant.recruiterId || '');
      setIsEditRecruiterOpen(true);
    },
    openSalaryDialog: () => {
      setSelectedSalary(applicant.expectedSalary?.toString() || '');
      setIsEditSalaryOpen(true);
    },
    openSourceDialog: () => {
      setSelectedSourceId(applicant.sourceId || '');
      setIsEditSourceOpen(true);
    },
    openStatusDialog: () => {
      setSelectedStatus(applicant.statusId || '');
      setIsEditStatusOpen(true);
    },
    selectedRecruiterId,
    selectedSalary,
    selectedSourceId,
    selectedStatus,
    setIsEditRecruiterOpen,
    setIsEditSalaryOpen,
    setIsEditSourceOpen,
    setIsEditStatusOpen,
    setSelectedRecruiterId,
    setSelectedSalary,
    setSelectedSourceId,
    setSelectedStatus,
  };
}
