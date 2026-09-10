"use client";

import { useState } from "react";

import { useEvaluationConfigAssignments } from "./use-evaluation-config-assignments";
import { useEvaluationConfigDataLoader } from "./use-evaluation-config-data-loader";
import { useEvaluationConfigTemplateState } from "./use-evaluation-config-template-state";

export type EvaluationConfigSubTab = "template" | "expertise" | "personality";

interface UseEvaluationConfigTabControllerOptions {
  positionId: string;
}

export function useEvaluationConfigTabController({
  positionId,
}: UseEvaluationConfigTabControllerOptions) {
  const [activeSubTab, setActiveSubTab] = useState<EvaluationConfigSubTab>("template");
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);

  const data = useEvaluationConfigDataLoader({ positionId });
  const assignments = useEvaluationConfigAssignments({
    positionId,
    expertiseSkills: data.expertiseSkills,
    positionExpertiseSkills: data.positionExpertiseSkills,
    personalityTraits: data.personalityTraits,
    positionPersonalityTraits: data.positionPersonalityTraits,
    loadPositionExpertiseSkills: data.loadPositionExpertiseSkills,
    loadPositionPersonalityTraits: data.loadPositionPersonalityTraits,
  });

  const template = useEvaluationConfigTemplateState({
    positionId,
    ...data,
  });

  const handleAddMethodSelect = (method: "template" | "custom") => {
    setIsAddMethodModalOpen(false);

    if (method === "template") {
      setActiveSubTab("template");
    } else {
      assignments.setIsAddExpertiseModalOpen(true);
    }
  };

  return {
    activeSubTab,
    setActiveSubTab,
    expertiseGroups: data.expertiseGroups,
    positionExpertiseSkills: data.positionExpertiseSkills,
    isLoadingExpertise: data.isLoadingExpertise,
    personalityGroups: data.personalityGroups,
    positionPersonalityTraits: data.positionPersonalityTraits,
    isLoadingPersonality: data.isLoadingPersonality,
    ...assignments,
    ...template,
    isAddMethodModalOpen,
    setIsAddMethodModalOpen,
    handleAddMethodSelect,
  };
}
