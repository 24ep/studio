"use client";

import { useCallback, useState } from "react";

import { fetchCreateEvaluateLinkPositionValidation } from "./create-evaluate-link-api";
import {
  type CreateEvaluateLinkApplicantInfo,
  type Interviewer,
  getApplicantPositionId,
  toggleStringSet,
} from "./create-evaluate-link-utils";
import {
  defaultPositionValidation,
  type PositionValidationState,
} from "./create-evaluate-link-resource-types";

export function useCreateEvaluateLinkPositionValidation(
  applicant: CreateEvaluateLinkApplicantInfo,
) {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<Set<string>>(new Set());
  const [positionValidation, setPositionValidation] = useState<PositionValidationState>(defaultPositionValidation);

  const validatePosition = useCallback(async () => {
    const positionId = getApplicantPositionId(applicant);
    if (!positionId) {
      setPositionValidation({
        hasInterviewers: false,
        hasSkills: false,
        isLoading: false,
        error: "Applicant has no assigned position",
      });
      return;
    }

    setPositionValidation((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const validation = await fetchCreateEvaluateLinkPositionValidation(positionId);
      setInterviewers(validation.interviewers);
      setSelectedInterviewerIds(new Set(validation.interviewers.map((interviewer) => interviewer.userId)));
      setPositionValidation({
        hasInterviewers: validation.hasInterviewers,
        hasSkills: validation.hasSkills,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error validating position:", error);
      setPositionValidation({
        hasInterviewers: false,
        hasSkills: false,
        isLoading: false,
        error: "Failed to validate position configuration",
      });
    }
  }, [applicant]);

  const toggleInterviewer = useCallback((userId: string) => {
    setSelectedInterviewerIds((currentIds) => toggleStringSet(currentIds, userId));
  }, []);

  return {
    canProceed: positionValidation.hasInterviewers && positionValidation.hasSkills,
    interviewers,
    positionValidation,
    selectedInterviewerIds,
    setSelectedInterviewerIds,
    toggleInterviewer,
    validatePosition,
  };
}
