"use client";

import {
  addPositionExpertiseSkills,
  addPositionPersonalityTraits,
  removePositionExpertiseSkill,
  removePositionPersonalityTrait,
} from "./evaluation-config-api";
import { filterAssignedEvaluationItems } from "./evaluation-config-utils";
import type {
  ExpertiseSkill,
  PersonalityTrait,
  PositionExpertiseSkill,
  PositionPersonalityTrait,
} from "./EvaluationConfigTabParts";
import { useEvaluationAssignmentRemoval } from "./use-evaluation-assignment-removal";
import { useEvaluationItemPicker } from "./use-evaluation-item-picker";

interface UseEvaluationConfigAssignmentsOptions {
  positionId: string;
  expertiseSkills: ExpertiseSkill[];
  positionExpertiseSkills: PositionExpertiseSkill[];
  personalityTraits: PersonalityTrait[];
  positionPersonalityTraits: PositionPersonalityTrait[];
  loadPositionExpertiseSkills: () => Promise<void>;
  loadPositionPersonalityTraits: () => Promise<void>;
}

export function useEvaluationConfigAssignments({
  positionId,
  expertiseSkills,
  positionExpertiseSkills,
  personalityTraits,
  positionPersonalityTraits,
  loadPositionExpertiseSkills,
  loadPositionPersonalityTraits,
}: UseEvaluationConfigAssignmentsOptions) {
  const assignedExpertiseSkillIds = positionExpertiseSkills.map(positionSkill => positionSkill.skillId);
  const assignedPersonalityTraitIds = positionPersonalityTraits.map(positionTrait => positionTrait.traitId);

  const expertisePicker = useEvaluationItemPicker({
    positionId,
    items: expertiseSkills,
    assignedIds: assignedExpertiseSkillIds,
    itemLabel: "skill",
    addItems: addPositionExpertiseSkills,
    reloadItems: loadPositionExpertiseSkills,
  });

  const personalityPicker = useEvaluationItemPicker({
    positionId,
    items: personalityTraits,
    assignedIds: assignedPersonalityTraitIds,
    itemLabel: "trait",
    addItems: addPositionPersonalityTraits,
    reloadItems: loadPositionPersonalityTraits,
  });

  const expertiseRemoval = useEvaluationAssignmentRemoval({
    positionId,
    errorLabel: "expertise skill",
    logMessage: "Error removing expertise skill:",
    removeAssignment: removePositionExpertiseSkill,
    reloadAssignments: loadPositionExpertiseSkills,
  });

  const personalityRemoval = useEvaluationAssignmentRemoval({
    positionId,
    errorLabel: "personality trait",
    logMessage: "Error removing personality trait:",
    removeAssignment: removePositionPersonalityTrait,
    reloadAssignments: loadPositionPersonalityTraits,
  });

  return {
    isAddExpertiseModalOpen: expertisePicker.isOpen,
    setIsAddExpertiseModalOpen: expertisePicker.setIsOpen,
    isAddPersonalityModalOpen: personalityPicker.isOpen,
    setIsAddPersonalityModalOpen: personalityPicker.setIsOpen,
    expertiseSearchTerm: expertisePicker.assignedSearchTerm,
    setExpertiseSearchTerm: expertisePicker.setAssignedSearchTerm,
    personalitySearchTerm: personalityPicker.assignedSearchTerm,
    setPersonalitySearchTerm: personalityPicker.setAssignedSearchTerm,
    isAddingExpertise: expertisePicker.isAdding,
    isAddingPersonality: personalityPicker.isAdding,
    isRemovingExpertise: expertiseRemoval.removingAssignmentId,
    isRemovingPersonality: personalityRemoval.removingAssignmentId,
    modalExpertiseSearchTerm: expertisePicker.modalSearchTerm,
    setModalExpertiseSearchTerm: expertisePicker.setModalSearchTerm,
    modalPersonalitySearchTerm: personalityPicker.modalSearchTerm,
    setModalPersonalitySearchTerm: personalityPicker.setModalSearchTerm,
    selectedSkills: expertisePicker.selectedItems,
    selectedTraits: personalityPicker.selectedItems,
    filteredModalExpertiseSkills: expertisePicker.filteredModalItems,
    filteredModalPersonalityTraits: personalityPicker.filteredModalItems,
    filteredPositionExpertiseSkills: filterAssignedEvaluationItems(
      positionExpertiseSkills,
      positionSkill => positionSkill.skill,
      expertisePicker.assignedSearchTerm,
    ),
    filteredPositionPersonalityTraits: filterAssignedEvaluationItems(
      positionPersonalityTraits,
      positionTrait => positionTrait.trait,
      personalityPicker.assignedSearchTerm,
    ),
    handleAddExpertiseSkills: expertisePicker.handleAddItems,
    handleSkillSelect: expertisePicker.handleSelectItem,
    handleToggleSelectAllInExpertiseGroup: expertisePicker.handleToggleSelectAllInGroup,
    handleRemoveSelectedSkill: expertisePicker.handleRemoveSelectedItem,
    handleCancelAddExpertiseSkills: expertisePicker.handleCancelAddItems,
    handleAddPersonalityTraits: personalityPicker.handleAddItems,
    handleTraitSelect: personalityPicker.handleSelectItem,
    handleToggleSelectAllInPersonalityGroup: personalityPicker.handleToggleSelectAllInGroup,
    handleRemoveSelectedTrait: personalityPicker.handleRemoveSelectedItem,
    handleCancelAddPersonalityTraits: personalityPicker.handleCancelAddItems,
    handleRemoveExpertiseSkill: expertiseRemoval.handleRemoveAssignment,
    handleRemovePersonalityTrait: personalityRemoval.handleRemoveAssignment,
  };
}
