"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant, Position } from '@/lib/types';
import { readJsonOrFallback } from '@/lib/response-json';

import type { AveragedEvaluationData, EvaluationRecord } from './types';
import type { GroupConfig } from './evaluate-result-grouping-utils';
import {
  buildAveragedEvaluationData,
  buildAveragedEvaluationDataFromSingleEvaluation,
  normalizeEvaluateResultHeaderSettings,
  type EvaluateResultHeaderSettings,
} from './utils';
import {
  normalizeEvaluationRecord,
  normalizeEvaluationRecords,
  normalizeGroupConfigs,
} from './evaluate-result-page-normalizers';

export function useEvaluateResultPageData(applicantId: string) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [averagedEvaluationData, setAveragedEvaluationData] = useState<AveragedEvaluationData | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationRecord[]>([]);
  const [headerSettings, setHeaderSettings] = useState<EvaluateResultHeaderSettings>(
    () => normalizeEvaluateResultHeaderSettings({})
  );
  const [personalityGroupsConfig, setPersonalityGroupsConfig] = useState<GroupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);

  const fetchApplicantData = useCallback(async () => {
    try {
      const response = await fetch(`/api/applicants/${applicantId}`, { credentials: 'include' });
      if (!response.ok) return;

      const data = await readJsonOrFallback<Applicant | null>(response, null);
      if (!data) return;

      setApplicant(data);

      if (data.positionId) {
        const posResponse = await fetch(`/api/positions/${data.positionId}`, { credentials: 'include' });
        if (posResponse.ok) {
          setPosition(await readJsonOrFallback<Position | null>(posResponse, null));
        }
      }
    } catch (error) {
      console.error('Error fetching Applicant data:', error);
    }
  }, [applicantId]);

  const fetchEvaluationData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/v1/applicants/${applicantId}/evaluations`);
      if (response.ok) {
        const evaluations = normalizeEvaluationRecords(await readJsonOrFallback<unknown>(response, []));
        setEvaluationState(evaluations);
        return;
      }

      const fallbackResponse = await fetch(`/api/v1/applicants/${applicantId}/evaluation`);
      if (fallbackResponse.ok) {
        const evaluation = normalizeEvaluationRecord(await readJsonOrFallback<unknown>(fallbackResponse, null));
        setAveragedEvaluationData(buildAveragedEvaluationDataFromSingleEvaluation(evaluation));
        setAllEvaluations(evaluation ? [evaluation] : []);
        return;
      }

      setEvaluationState([]);
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      toast.error('Failed to load evaluation data');
      setEvaluationState([]);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  const fetchPersonalityGroupsConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/evaluation/personality-traits');
      if (response.ok) {
        setPersonalityGroupsConfig(normalizeGroupConfigs(await readJsonOrFallback<unknown>(response, {})));
      }
    } catch (error) {
      console.error('Error fetching personality groups config:', error);
    }
  }, []);

  const fetchHeaderSettings = useCallback(async () => {
    try {
      const settingsRes = await fetch('/api/settings/system-settings?keys=evaluateReportLogoDataUrl,evaluatePlatformLogoDataUrl,appLogoDataUrl,organizationLogoDataUrl,organizationName,organizationAddress,organizationContact,evaluateHeaderBackgroundType,evaluateHeaderBackgroundImageUrl,evaluateHeaderBackgroundGradient,evaluateHeaderBackgroundGradientStart,evaluateHeaderBackgroundGradientEnd,evaluateHeaderBackgroundColor,evaluateHeaderTextColor');
      if (settingsRes.ok) {
        setHeaderSettings(normalizeEvaluateResultHeaderSettings(
          await readJsonOrFallback<unknown>(settingsRes, {})
        ));
      }
    } catch {
      // Header branding is optional for the report.
    }
  }, []);

  useEffect(() => {
    if (!applicantId) return;

    fetchApplicantData();
    fetchEvaluationData();
    fetchHeaderSettings();
    fetchPersonalityGroupsConfig();
    setIsInIframe(window.self !== window.top);
  }, [
    applicantId,
    fetchApplicantData,
    fetchEvaluationData,
    fetchHeaderSettings,
    fetchPersonalityGroupsConfig,
  ]);

  return {
    applicant,
    setApplicant,
    position,
    averagedEvaluationData,
    allEvaluations,
    headerSettings,
    personalityGroupsConfig,
    loading,
    isInIframe,
  };

  function setEvaluationState(evaluations: EvaluationRecord[]) {
    setAveragedEvaluationData(evaluations.length > 0
      ? buildAveragedEvaluationData(evaluations)
      : null);
    setAllEvaluations(evaluations);
  }
}
