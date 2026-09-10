"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAveragedEvaluation,
  calculateExpertiseAverage,
  calculatePersonalityAverage,
  groupExpertiseSkills,
  groupPersonalityTraits,
  type EvaluationData,
} from "./applicant-evaluation-section-utils";
import { isJsonObject, readJsonOrFallback } from "@/lib/response-json";

function normalizeEvaluationDataList(value: unknown): EvaluationData[] {
  return Array.isArray(value)
    ? value.filter(isJsonObject).map((evaluation) => evaluation as unknown as EvaluationData)
    : [];
}

async function fetchApplicantEvaluations(applicantId: string) {
  const response = await fetch(`/api/v1/applicants/${applicantId}/evaluations`, {
    credentials: "include",
  });

  if (response.ok) {
    return normalizeEvaluationDataList(await readJsonOrFallback<unknown>(response, []));
  }

  const fallbackResponse = await fetch(`/api/v1/applicants/${applicantId}/evaluation`, {
    credentials: "include",
  });

  if (!fallbackResponse.ok) {
    return [];
  }

  const data = await readJsonOrFallback<unknown>(fallbackResponse, null);
  return isJsonObject(data) && typeof data.id === "string"
    ? [data as unknown as EvaluationData]
    : [];
}

export function useApplicantEvaluationSection(applicantId: string) {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadEvaluationData = async () => {
      try {
        setLoading(true);
        const evaluations = await fetchApplicantEvaluations(applicantId);

        if (!isMounted) return;

        setAllEvaluations(evaluations);
        setEvaluation(buildAveragedEvaluation(evaluations));
      } catch (error) {
        console.error("Error fetching evaluation:", error);
        if (isMounted) {
          setEvaluation(null);
          setAllEvaluations([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvaluationData();

    return () => {
      isMounted = false;
    };
  }, [applicantId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const nextExpandedGroups = new Set(prev);
      if (nextExpandedGroups.has(groupId)) {
        nextExpandedGroups.delete(groupId);
      } else {
        nextExpandedGroups.add(groupId);
      }
      return nextExpandedGroups;
    });
  };

  return {
    evaluation,
    allEvaluations,
    loading,
    expandedGroups,
    toggleGroup,
    expertiseGroups: useMemo(() => groupExpertiseSkills(evaluation), [evaluation]),
    personalityGroups: useMemo(() => groupPersonalityTraits(allEvaluations, evaluation), [allEvaluations, evaluation]),
    expertiseAvg: useMemo(() => calculateExpertiseAverage(evaluation), [evaluation]),
    personalityAvg: useMemo(() => calculatePersonalityAverage(evaluation), [evaluation]),
  };
}
