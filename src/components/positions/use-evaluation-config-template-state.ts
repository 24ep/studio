"use client";

import type { Dispatch, SetStateAction } from "react";

import type {
  EvaluationTemplate,
  ExpertiseGroup,
  ExpertiseSkill,
  PersonalityGroup,
  PersonalityTrait,
  PositionExpertiseSkill,
  PositionPersonalityTrait,
} from "./EvaluationConfigTabParts";
import { useEvaluationTemplateController } from "./use-evaluation-template-controller";

interface UseEvaluationConfigTemplateStateOptions {
  positionId: string;
  templates: EvaluationTemplate[];
  isLoadingTemplates: boolean;
  selectedTemplateId: string;
  setSelectedTemplateId: Dispatch<SetStateAction<string>>;
  saveTemplateId: (templateId: string | null) => Promise<void>;
  expertiseGroups: ExpertiseGroup[];
  expertiseSkills: ExpertiseSkill[];
  positionExpertiseSkills: PositionExpertiseSkill[];
  personalityGroups: PersonalityGroup[];
  personalityTraits: PersonalityTrait[];
  positionPersonalityTraits: PositionPersonalityTrait[];
  loadPositionExpertiseSkills: () => Promise<void>;
  loadPositionPersonalityTraits: () => Promise<void>;
}

export function useEvaluationConfigTemplateState({
  positionId,
  templates,
  isLoadingTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  saveTemplateId,
  expertiseGroups,
  expertiseSkills,
  positionExpertiseSkills,
  personalityGroups,
  personalityTraits,
  positionPersonalityTraits,
  loadPositionExpertiseSkills,
  loadPositionPersonalityTraits,
}: UseEvaluationConfigTemplateStateOptions) {
  const template = useEvaluationTemplateController({
    positionId,
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    saveTemplateId,
    expertiseGroups,
    expertiseSkills,
    positionExpertiseSkills,
    personalityGroups,
    personalityTraits,
    positionPersonalityTraits,
    reloadAssignments: async () => {
      await Promise.all([
        loadPositionExpertiseSkills(),
        loadPositionPersonalityTraits(),
      ]);
    },
  });

  return {
    isApplyingTemplate: template.isApplyingTemplate,
    templates,
    isLoadingTemplates,
    selectedTemplateId,
    selectedTemplate: template.selectedTemplate,
    templateSkillIds: template.templateSkillIds,
    templateTraitIds: template.templateTraitIds,
    templateSearch: template.templateSearch,
    setTemplateSearch: template.setTemplateSearch,
    isTemplateFullyApplied: template.isTemplateFullyApplied,
    templateExpertiseSections: template.templateExpertiseSections,
    templatePersonalitySections: template.templatePersonalitySections,
    handleApplyTemplate: template.handleApplyTemplate,
    handleTemplateSelect: template.handleTemplateSelect,
    handleUnlinkTemplate: template.handleUnlinkTemplate,
  };
}
