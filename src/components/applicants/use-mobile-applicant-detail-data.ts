import { useCallback, useEffect, useRef, useState } from "react";

import type { Applicant, Position, RecruitmentStage, TransitionRecord } from "@/lib/types";
import {
  loadMobileApplicantDetailData,
  type MobileApplicantAttachment,
  type MobileApplicantComment,
  type MobileApplicantReference,
} from "./mobile-applicant-detail-api";
import {
  getMobileApplicantDetailErrorMessage,
  isMobileApplicantDetailAbortError,
} from "./mobile-applicant-detail-errors";

export function useMobileApplicantDetailData(applicantId: string) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [allDbPositions, setAllDbPositions] = useState<Position[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);
  const [availableRecruiters, setAvailableRecruiters] = useState<MobileApplicantReference[]>([]);
  const [availableSources, setAvailableSources] = useState<MobileApplicantReference[]>([]);
  const [comments, setComments] = useState<MobileApplicantComment[]>([]);
  const [attachments, setAttachments] = useState<MobileApplicantAttachment[]>([]);
  const [transitionHistory, setTransitionHistory] = useState<TransitionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (!applicantId) {
      setIsLoading(false);
      setError("Invalid applicant ID");
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const detailData = await loadMobileApplicantDetailData(applicantId, abortControllerRef.current.signal);
      if (!mountedRef.current) return;

      setApplicant(detailData.applicant);
      setAllDbPositions(detailData.positions);
      setAvailableStages(detailData.stages);
      setAvailableRecruiters(detailData.recruiters);
      setAvailableSources(detailData.sources);
      setComments(detailData.comments);
      setAttachments(detailData.attachments);
      setTransitionHistory(detailData.transitions);
      setIsLoading(false);
    } catch (error) {
      if (isMobileApplicantDetailAbortError(error)) {
        return;
      }

      console.error("Error loading applicant data:", error);
      if (mountedRef.current) {
        setError(getMobileApplicantDetailErrorMessage(error, "Failed to load applicant data"));
        setIsLoading(false);
      }
    }
  }, [applicantId]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [loadData]);

  return {
    applicant,
    allDbPositions,
    availableStages,
    availableRecruiters,
    availableSources,
    comments,
    attachments,
    transitionHistory,
    isLoading,
    error,
    loadData,
  };
}
