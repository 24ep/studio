import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { EvaluationFormData, Interviewer } from './types';
import {
  buildEvaluatePageCallbackUrl,
  buildEvaluateSignInUrl,
  getDefaultEvaluationInterviewerId,
  getEvaluationTraitNavigationUpdate,
} from './utils';

interface EvaluationPageEffectsOptions {
  applicantId: string;
  searchParams: { get(name: string): string | null };
  sessionStatus: SessionStatus;
  hasToken: boolean;
  evaluationLinkRequireLogin: boolean | null;
  loading: boolean;
  loadingEvaluation: boolean;
  selectedInterviewerId: string | null;
  interviewers: Interviewer[];
  formData: EvaluationFormData | null;
  showForm: boolean;
  fetchEvaluationData: () => void | Promise<void>;
  fetchExistingEvaluation: () => void | Promise<void>;
  fetchPersonalityGroupsConfig: () => void | Promise<void>;
  navigateToSignIn: (url: string) => void;
  replaceUrl: (url: string, options?: { scroll?: boolean }) => void;
  setFormData: Dispatch<SetStateAction<EvaluationFormData | null>>;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setSelectedInterviewerId: Dispatch<SetStateAction<string | null>>;
}

type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading';

export function useApplicantEvaluationPageEffects({
  applicantId,
  searchParams,
  sessionStatus,
  hasToken,
  evaluationLinkRequireLogin,
  loading,
  loadingEvaluation,
  selectedInterviewerId,
  interviewers,
  formData,
  showForm,
  fetchEvaluationData,
  fetchExistingEvaluation,
  fetchPersonalityGroupsConfig,
  navigateToSignIn,
  replaceUrl,
  setFormData,
  setShowForm,
  setSelectedInterviewerId,
}: EvaluationPageEffectsOptions) {
  useEffect(() => {
    if (applicantId) {
      fetchEvaluationData();
      fetchExistingEvaluation();
      fetchPersonalityGroupsConfig();
    }
  }, [applicantId, searchParams]);

  useEffect(() => {
    if (!showForm) {
      fetchExistingEvaluation();
    }
  }, [showForm, applicantId]);

  useEffect(() => {
    if (applicantId && formData && showForm) {
      fetchEvaluationData();
    }
  }, [selectedInterviewerId]);

  useEffect(() => {
    if (hasToken && evaluationLinkRequireLogin === true && sessionStatus !== 'authenticated' && sessionStatus !== 'loading') {
      navigateToSignIn(buildEvaluateSignInUrl(
        buildEvaluatePageCallbackUrl(applicantId, searchParams.get('token'))
      ));
    }
  }, [hasToken, evaluationLinkRequireLogin, sessionStatus, applicantId, searchParams, navigateToSignIn]);

  useEffect(() => {
    if (applicantId && showForm && selectedInterviewerId) {
      fetchEvaluationData();
    }
  }, [showForm]);

  useEffect(() => {
    const traitId = searchParams.get('traitId');

    if (traitId && formData && !showForm) {
      const navigationUpdate = getEvaluationTraitNavigationUpdate(formData, traitId);
      if (navigationUpdate) {
        setFormData(navigationUpdate.formData);
        setShowForm(true);
        replaceUrl(`/applicants/${applicantId}/evaluate`, { scroll: false });
      }
    }
  }, [searchParams, formData, showForm, applicantId, replaceUrl]);

  useEffect(() => {
    const defaultInterviewerId = getDefaultEvaluationInterviewerId({
      loading,
      loadingEvaluation,
      selectedInterviewerId,
      interviewers,
    });

    if (defaultInterviewerId) {
      setSelectedInterviewerId(defaultInterviewerId);
    }
  }, [loading, loadingEvaluation, selectedInterviewerId, interviewers]);
}
