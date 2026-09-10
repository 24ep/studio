"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo } from "react";

import type { SkillTemplatesData } from "./skill-templates-api";
import {
  getSelectedNames,
  selectAllUngroupedIds,
  toggleExpertiseGroupSelection,
  toggleIdSelection,
  togglePersonalityGroupSelection,
  type SkillTemplateFormData,
} from "./skill-templates-utils";

export function useSkillTemplateSelectionActions({
  data,
  setTemplateFormData,
  templateFormData,
}: {
  data: SkillTemplatesData;
  setTemplateFormData: Dispatch<SetStateAction<SkillTemplateFormData>>;
  templateFormData: SkillTemplateFormData;
}) {
  const handleGroupToggle = useCallback((groupId: string) => {
    setTemplateFormData((prev) => toggleExpertiseGroupSelection(prev, groupId, data.skills));
  }, [data.skills, setTemplateFormData]);

  const handleSkillToggle = useCallback((skillId: string) => {
    setTemplateFormData((prev) => ({
      ...prev,
      skillIds: toggleIdSelection(prev.skillIds, skillId),
    }));
  }, [setTemplateFormData]);

  const handlePersonalityGroupToggle = useCallback((groupId: string) => {
    setTemplateFormData((prev) => togglePersonalityGroupSelection(prev, groupId, data.personalityTraits));
  }, [data.personalityTraits, setTemplateFormData]);

  const handlePersonalityTraitToggle = useCallback((traitId: string) => {
    setTemplateFormData((prev) => ({
      ...prev,
      personalityTraitIds: toggleIdSelection(prev.personalityTraitIds, traitId),
    }));
  }, [setTemplateFormData]);

  const handleSelectAllExpertiseSkills = useCallback(() => {
    setTemplateFormData((prev) => ({
      ...prev,
      skillIds: selectAllUngroupedIds(prev.skillIds, data.skills),
    }));
  }, [data.skills, setTemplateFormData]);

  const handleSelectAllPersonalityTraits = useCallback(() => {
    setTemplateFormData((prev) => ({
      ...prev,
      personalityTraitIds: selectAllUngroupedIds(prev.personalityTraitIds, data.personalityTraits),
    }));
  }, [data.personalityTraits, setTemplateFormData]);

  const selectedNames = useMemo(() => ({
    expertiseGroups: getSelectedNames(data.groups, templateFormData.groupIds),
    expertiseSkills: getSelectedNames(data.skills, templateFormData.skillIds),
    personalityGroups: getSelectedNames(data.personalityGroups, templateFormData.personalityGroupIds),
    personalityTraits: getSelectedNames(data.personalityTraits, templateFormData.personalityTraitIds),
  }), [data, templateFormData]);

  return {
    handleGroupToggle,
    handlePersonalityGroupToggle,
    handlePersonalityTraitToggle,
    handleSelectAllExpertiseSkills,
    handleSelectAllPersonalityTraits,
    handleSkillToggle,
    selectedNames,
  };
}
