"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-hot-toast";

import type {
  EvaluationTemplate,
  ExpertiseGroup,
  ExpertiseSkill,
  PersonalityGroup,
  PersonalityTrait,
  PositionExpertiseSkill,
  PositionPersonalityTrait,
} from "./EvaluationConfigTabParts";
import { applyEvaluationTemplateTasks } from "./evaluation-config-api";
import {
  buildEvaluationTemplateApplyTasks,
  buildEvaluationTemplatePreviewSections,
  getEvaluationTemplateIds,
  isEvaluationTemplateFullyApplied,
  summarizeEvaluationTemplateApplyResults,
} from "./evaluation-config-utils";

interface UseEvaluationTemplateControllerOptions {
  positionId: string;
  templates: EvaluationTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: Dispatch<SetStateAction<string>>;
  saveTemplateId: (templateId: string | null) => Promise<void>;
  expertiseGroups: ExpertiseGroup[];
  expertiseSkills: ExpertiseSkill[];
  positionExpertiseSkills: PositionExpertiseSkill[];
  personalityGroups: PersonalityGroup[];
  personalityTraits: PersonalityTrait[];
  positionPersonalityTraits: PositionPersonalityTrait[];
  reloadAssignments: () => Promise<void>;
}

export function useEvaluationTemplateController({
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
  reloadAssignments,
}: UseEvaluationTemplateControllerOptions) {
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates],
  );
  const { skillIds: templateSkillIds, traitIds: templateTraitIds } = getEvaluationTemplateIds(selectedTemplate);

  const isTemplateFullyApplied = useMemo(() => (
    isEvaluationTemplateFullyApplied(selectedTemplate, positionExpertiseSkills, positionPersonalityTraits)
  ), [selectedTemplate, positionExpertiseSkills, positionPersonalityTraits]);

  const templateExpertiseSections = useMemo(() => (
    buildEvaluationTemplatePreviewSections(
      expertiseGroups,
      selectedTemplate?.templateSkills?.map(templateSkill => ({ id: templateSkill.id, item: templateSkill.skill })),
      "Other Skills",
    )
  ), [expertiseGroups, selectedTemplate]);

  const templatePersonalitySections = useMemo(() => (
    buildEvaluationTemplatePreviewSections(
      personalityGroups,
      selectedTemplate?.templatePersonalityTraits?.map(templateTrait => ({ id: templateTrait.id, item: templateTrait.trait })),
      "Other Traits",
    )
  ), [personalityGroups, selectedTemplate]);

  const handleTemplateSelect = async (newTemplateId: string) => {
    setSelectedTemplateId(newTemplateId);
    await saveTemplateId(newTemplateId || null);
  };

  const handleUnlinkTemplate = async () => {
    setSelectedTemplateId("");
    await saveTemplateId(null);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !positionId) return;

    setIsApplyingTemplate(true);
    try {
      await saveTemplateId(selectedTemplate.id);

      const templateApplyTasks = buildEvaluationTemplateApplyTasks({
        template: selectedTemplate,
        positionSkills: positionExpertiseSkills,
        positionTraits: positionPersonalityTraits,
        expertiseGroups,
        expertiseSkills,
        personalityGroups,
        personalityTraits,
      });

      if (templateApplyTasks.length === 0) {
        toast.success("Template already applied");
      } else {
        const results = await applyEvaluationTemplateTasks(positionId, templateApplyTasks);
        const summary = summarizeEvaluationTemplateApplyResults(results);

        if (summary.failureMessage) {
          toast.error(summary.failureMessage);
        }
        if (summary.successMessage) {
          toast.success(summary.successMessage);
        }
      }

      await reloadAssignments();
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  return {
    selectedTemplate,
    templateSkillIds,
    templateTraitIds,
    isApplyingTemplate,
    templateSearch,
    setTemplateSearch,
    isTemplateFullyApplied,
    templateExpertiseSections,
    templatePersonalitySections,
    handleTemplateSelect,
    handleUnlinkTemplate,
    handleApplyTemplate,
  };
}
