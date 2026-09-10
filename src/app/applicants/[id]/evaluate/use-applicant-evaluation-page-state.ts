import React, { useState } from 'react';
import type {
  EvaluationFormData,
  EvaluationPersonalityGroupConfig,
  EvaluationSummary,
  Interviewer,
  TestingResult,
} from './types';
import type { EvaluatePageJobAppliedOptions } from './evaluate-page-preferences-utils';
import { useEvaluationMobileQuestionNav } from './use-evaluation-mobile-question-nav';

export function useApplicantEvaluationPageState() {
  const [formData, setFormData] = useState<EvaluationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingResults, setTestingResults] = useState<TestingResult[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [positionTitle, setPositionTitle] = useState<string | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<EvaluationSummary | null>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [allEvaluations, setAllEvaluations] = useState<Map<string, EvaluationSummary>>(new Map());
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null);
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [remarkSectionVisible, setRemarkSectionVisible] = useState(true);
  const [personalityGroupsConfig, setPersonalityGroupsConfig] = useState<EvaluationPersonalityGroupConfig[]>([]);
  const [applicantRecruiterId, setApplicantRecruiterId] = useState<string | null>(null);
  const [applicantData, setApplicantData] = useState<EvaluationFormData['applicant'] | null>(null);
  const [allDbPositions, setAllDbPositions] = useState<EvaluatePageJobAppliedOptions['positions']>([]);
  const [availableStages, setAvailableStages] = useState<EvaluatePageJobAppliedOptions['stages']>([]);
  const [availableRecruiters, setAvailableRecruiters] = useState<EvaluatePageJobAppliedOptions['recruiters']>([]);
  const [availableSources, setAvailableSources] = useState<EvaluatePageJobAppliedOptions['sources']>([]);

  const testingResultsRef = React.useRef(testingResults);
  const { skillsListRef, lineStyle } = useEvaluationMobileQuestionNav(formData);

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    saving,
    setSaving,
    error,
    setError,
    showForm,
    setShowForm,
    testingResults,
    setTestingResults,
    interviewers,
    setInterviewers,
    positionId,
    setPositionId,
    positionTitle,
    setPositionTitle,
    existingEvaluation,
    setExistingEvaluation,
    loadingEvaluation,
    setLoadingEvaluation,
    allEvaluations,
    setAllEvaluations,
    selectedInterviewerId,
    setSelectedInterviewerId,
    reportDrawerOpen,
    setReportDrawerOpen,
    successModalOpen,
    setSuccessModalOpen,
    remarkSectionVisible,
    setRemarkSectionVisible,
    personalityGroupsConfig,
    setPersonalityGroupsConfig,
    applicantRecruiterId,
    setApplicantRecruiterId,
    applicantData,
    setApplicantData,
    allDbPositions,
    setAllDbPositions,
    availableStages,
    setAvailableStages,
    availableRecruiters,
    setAvailableRecruiters,
    availableSources,
    setAvailableSources,
    testingResultsRef,
    skillsListRef,
    lineStyle,
  };
}
