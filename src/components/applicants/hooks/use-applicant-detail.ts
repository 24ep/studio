import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Applicant } from '@/lib/types';
import { useEnhancedSSE } from '@/hooks/use-enhanced-sse';
import { useApplicantAutoMarkRead } from './use-applicant-auto-mark-read';
import { useApplicantDetailAssignmentActions } from './use-applicant-detail-assignment-actions';
import { useApplicantAvatarUpload } from './use-applicant-avatar-upload';
import { useApplicantDetailEditForm } from './use-applicant-detail-edit-form';
import { useApplicantDetailFetch } from './use-applicant-detail-fetch';
import { useApplicantDetailReferenceData } from './use-applicant-detail-reference-data';
import { useApplicantDetailToggleActions } from './use-applicant-detail-toggle-actions';
import {
  calculateApplicantAverageExperienceDuration,
  calculateApplicantTotalExperienceDuration,
  type ApplicantJobMatchLike,
} from '../full-applicant-detail-utils';

interface UseApplicantDetailOptions {
  initialApplicant?: Applicant | null;
}

const EMPTY_APPLICANT_JOB_MATCHES: ApplicantJobMatchLike[] = [];

export const useApplicantDetail = (applicantId: string, options?: UseApplicantDetailOptions) => {
  const { success: toastSuccess, error: toastError } = useToast();
  const initialApplicant = options?.initialApplicant ?? null;

  const [applicant, setApplicant] = useState<Applicant | null>(initialApplicant);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedJobApplied, setCopiedJobApplied] = useState(false);
  const [copiedJobMatchIndex, setCopiedJobMatchIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileEditRequestKey, setProfileEditRequestKey] = useState(0);
  const [customFieldsRefreshTrigger, setCustomFieldsRefreshTrigger] = useState(0);

  useApplicantAutoMarkRead({ applicant, setApplicant });

  const {
    avatarUploading,
    avatarError,
    avatarForceRefresh,
    handleAvatarUpload,
  } = useApplicantAvatarUpload({
    applicant,
    setApplicant,
    toastSuccess,
    toastError,
  });

  const {
    handleTogglePin,
    handleToggleBlacklist,
    handleToggleRead,
  } = useApplicantDetailToggleActions({
    applicant,
    setApplicant,
    toastSuccess,
    toastError,
  });

  const {
    allDbPositions,
    availableRecruiter,
    availableSources,
    availableStages,
    transitionHistory,
    setTransitionHistory,
    fetchTransitionHistory,
  } = useApplicantDetailReferenceData(applicantId);

  const {
    isAssigningRecruiter,
    isAssigningSource,
    setIsAssigningRecruiter,
    setIsAssigningSource,
    handleAssignRecruiter,
    handleAssignSource,
  } = useApplicantDetailAssignmentActions({
    applicantId,
    setApplicant,
    toastSuccess,
    toastError,
  });

  const {
    error,
    fetchApplicant,
    loading,
  } = useApplicantDetailFetch({
    applicant,
    applicantId,
    initialApplicant,
    setApplicant,
  });

  const {
    control,
    handleSubmit,
    reset,
    register,
    errors,
    watch,
    setValue,
    appendEducation,
    removeEducation,
    appendExperience,
    removeExperience,
    appendSkill,
    removeSkill,
    appendJobSuitable,
    removeJobSuitable,
    appendJobMatch,
    removeJobMatch,
    educationFields,
    experienceFields,
    formPopulated,
    jobMatchesFields,
    jobSuitableFields,
    setFormPopulated,
    skillsFields,
  } = useApplicantDetailEditForm(applicant, isEditing);

  const { isConnected: realtimeConnected } = useEnhancedSSE();

  // The profile uses employee-style, per-attribute editing. The header action
  // opens the personal details tab instead of switching every field into a form.
  const handleEnterEditMode = useCallback(() => {
    if (applicant) {
      setProfileEditRequestKey(current => current + 1);
    }
  }, [applicant]);

  const calculateTotalExperienceDuration = useCallback(calculateApplicantTotalExperienceDuration, []);
  const calculateAverageDurationPerCompany = useCallback(calculateApplicantAverageExperienceDuration, []);

  return {
    // State
    applicant,
    loading,
    error,
    isEditing,
    allDbPositions,
    availableRecruiter,
    availableSources,
    availableStages,
    transitionHistory,
    applicantJobMatches: EMPTY_APPLICANT_JOB_MATCHES,
    isAssigningRecruiter,
    isAssigningSource,
    avatarUploading,
    avatarError,
    avatarForceRefresh,
    copiedJobApplied,
    copiedJobMatchIndex,
    isSaving,
    realtimeConnected,
    formPopulated,
    profileEditRequestKey,

    // Form
    control,
    handleSubmit,
    reset,
    register,
    errors,
    watch,
    setValue,
    educationFields,
    appendEducation,
    removeEducation,
    experienceFields,
    appendExperience,
    removeExperience,
    skillsFields,
    appendSkill,
    removeSkill,
    jobSuitableFields,
    appendJobSuitable,
    removeJobSuitable,
    jobMatchesFields,
    appendJobMatch,
    removeJobMatch,

    // Actions
    setIsEditing,
    setCopiedJobApplied,
    setCopiedJobMatchIndex,
    setIsSaving,
    setIsAssigningRecruiter,
    setIsAssigningSource,
    setApplicant,
    setTransitionHistory,
    handleEnterEditMode,

    // Functions
    calculateTotalExperienceDuration,
    calculateAverageDurationPerCompany,
    handleAssignRecruiter,
    handleAssignSource,
    handleAvatarUpload,
    fetchApplicant, // Expose the memoized fetch function
    fetchTransitionHistory,
    handleTogglePin,
    handleToggleBlacklist,
    handleToggleRead,

    // Custom fields refresh
    customFieldsRefreshTrigger,
    refreshCustomFields: () => setCustomFieldsRefreshTrigger(prev => prev + 1),
  };
};
