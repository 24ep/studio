import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type {
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
  Interviewer,
  TestingResult,
} from './types';
import {
  buildEvaluationDataLoadState,
  fetchEvaluatePageJobAppliedOptions,
  sortPersonalityGroupsByDisplayOrder,
  buildEvaluateSignInUrl,
} from './utils';
import {
  EvaluatePageAuthRedirectError,
  fetchEvaluateApplicantAndCriteria,
  fetchEvaluatePersonalityGroupsConfig,
  fetchEvaluatePositionInterviewers,
  fetchExistingApplicantEvaluationData,
} from './evaluate-page-api';
import type { EvaluatePageJobAppliedOptions } from './evaluate-page-preferences-utils';

type SearchParamsLike = {
  get: (key: string) => string | null;
};

type UseEvaluationPageDataLoaderInput = {
  applicantId: string;
  searchParams: SearchParamsLike;
  selectedInterviewerId: string | null;
  reloadAttachments: () => Promise<unknown>;
  loadEvaluateThemeSettings: () => Promise<unknown>;
  applyExistingEvaluationRefreshState: (evaluations?: EvaluationSummary[] | EvaluationSummary | null) => void;
  navigateToSignIn: (url: string) => void;
  setApplicantData: Dispatch<SetStateAction<EvaluationFormData['applicant'] | null>>;
  setApplicantRecruiterId: Dispatch<SetStateAction<string | null>>;
  setPositionId: Dispatch<SetStateAction<string | null>>;
  setPositionTitle: Dispatch<SetStateAction<string | null>>;
  setAllEvaluations: Dispatch<SetStateAction<Map<string, EvaluationSummary>>>;
  setTestingResults: Dispatch<SetStateAction<TestingResult[]>>;
  setInterviewers: Dispatch<SetStateAction<Interviewer[]>>;
  setAllDbPositions: Dispatch<SetStateAction<EvaluatePageJobAppliedOptions['positions']>>;
  setAvailableStages: Dispatch<SetStateAction<EvaluatePageJobAppliedOptions['stages']>>;
  setAvailableRecruiters: Dispatch<SetStateAction<EvaluatePageJobAppliedOptions['recruiters']>>;
  setAvailableSources: Dispatch<SetStateAction<EvaluatePageJobAppliedOptions['sources']>>;
  setPersonalityGroupsConfig: Dispatch<SetStateAction<EvaluationPersonalityGroupConfig[]>>;
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setLoadingEvaluation: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useEvaluationPageDataLoader({
  applicantId,
  searchParams,
  selectedInterviewerId,
  reloadAttachments,
  loadEvaluateThemeSettings,
  applyExistingEvaluationRefreshState,
  navigateToSignIn,
  setApplicantData,
  setApplicantRecruiterId,
  setPositionId,
  setPositionTitle,
  setAllEvaluations,
  setTestingResults,
  setInterviewers,
  setAllDbPositions,
  setAvailableStages,
  setAvailableRecruiters,
  setAvailableSources,
  setPersonalityGroupsConfig,
  setFormData,
  setLoading,
  setLoadingEvaluation,
  setError,
}: UseEvaluationPageDataLoaderInput) {
  const fetchExistingEvaluation = useCallback(async () => {
    try {
      setLoadingEvaluation(true);
      const data = await fetchExistingApplicantEvaluationData(applicantId);
      applyExistingEvaluationRefreshState(data);
    } catch (error) {
      console.error('Error fetching existing evaluation:', error);
      applyExistingEvaluationRefreshState(null);
    } finally {
      setLoadingEvaluation(false);
    }
  }, [applicantId, applyExistingEvaluationRefreshState, setLoadingEvaluation]);

  const fetchPersonalityGroupsConfig = useCallback(async () => {
    try {
      const groups = await fetchEvaluatePersonalityGroupsConfig();
      setPersonalityGroupsConfig(sortPersonalityGroupsByDisplayOrder(groups));
    } catch (error) {
      console.error('Error fetching personality groups config:', error);
    }
  }, [setPersonalityGroupsConfig]);

  const fetchEvaluationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = searchParams.get('token');
      const {
        applicant,
        applicantPositionId,
        positionTitle: applicantPositionTitle,
        evaluationCriteria,
      } = await fetchEvaluateApplicantAndCriteria(applicantId, token);
      setApplicantData(applicant);

      let existingEvaluationData: EvaluationSummary[] | EvaluationSummary | null = null;
      try {
        existingEvaluationData = await fetchExistingApplicantEvaluationData(applicantId);
      } catch (error) {
        console.debug('No existing evaluation found:', error);
      }

      const evaluationLoadState = buildEvaluationDataLoadState({
        applicant,
        applicantPositionId,
        positionTitle: applicantPositionTitle,
        evaluationCriteria,
        existingEvaluationData,
        selectedInterviewerId,
      });

      setApplicantRecruiterId(evaluationLoadState.applicantRecruiterId);
      setPositionId(evaluationLoadState.positionId);
      setPositionTitle(evaluationLoadState.positionTitle);
      if (evaluationLoadState.evaluationsMap) {
        setAllEvaluations(evaluationLoadState.evaluationsMap);
      }
      setTestingResults(evaluationLoadState.testingResults);

      await reloadAttachments();

      try {
        setInterviewers(await fetchEvaluatePositionInterviewers(applicantPositionId));
      } catch { }

      const jobAppliedOptions = await fetchEvaluatePageJobAppliedOptions();
      setAllDbPositions(jobAppliedOptions.positions);
      setAvailableStages(jobAppliedOptions.stages);
      setAvailableRecruiters(jobAppliedOptions.recruiters);
      setAvailableSources(jobAppliedOptions.sources);

      await loadEvaluateThemeSettings();
      setFormData(evaluationLoadState.formData);
    } catch (error) {
      if (error instanceof EvaluatePageAuthRedirectError) {
        navigateToSignIn(buildEvaluateSignInUrl(window.location.href));
        return;
      }

      console.error('Error fetching evaluation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load evaluation data');
      toast.error('Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  }, [
    applicantId,
    loadEvaluateThemeSettings,
    navigateToSignIn,
    reloadAttachments,
    searchParams,
    selectedInterviewerId,
    setAllDbPositions,
    setAllEvaluations,
    setApplicantData,
    setApplicantRecruiterId,
    setAvailableRecruiters,
    setAvailableSources,
    setAvailableStages,
    setError,
    setFormData,
    setInterviewers,
    setLoading,
    setPositionId,
    setPositionTitle,
    setTestingResults,
  ]);

  return {
    fetchEvaluationData,
    fetchExistingEvaluation,
    fetchPersonalityGroupsConfig,
  };
}
