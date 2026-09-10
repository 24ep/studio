"use client";

import type { ReactElement } from "react";
import { BrainCircuit, Target } from "lucide-react";

import { AddEvaluationItemsSheet } from "./EvaluationConfigTabParts";
import { AssignedItemsEmptyState } from "./EvaluationConfigAssignedPanelParts";
import type { useEvaluationConfigTabController } from "./use-evaluation-config-tab-controller";

type EvaluationConfigController = ReturnType<typeof useEvaluationConfigTabController>;

interface AddItemsSheetProps {
  controller: EvaluationConfigController;
  positionTitle: string;
}

interface EmptyStateProps {
  hasSearchTerm: boolean;
  onAdd: () => void;
}

export function AddExpertiseSkillsSheet({
  controller,
  positionTitle,
}: AddItemsSheetProps): ReactElement {
  return (
    <AddEvaluationItemsSheet
      open={controller.isAddExpertiseModalOpen}
      onOpenChange={controller.setIsAddExpertiseModalOpen}
      title="Add Expertise Skills"
      description={`Select multiple skills to add to "${positionTitle}"`}
      sheetId="add-expertise-skill-drawer"
      searchPlaceholder="Search skills..."
      searchTerm={controller.modalExpertiseSearchTerm}
      onSearchTermChange={controller.setModalExpertiseSearchTerm}
      selectedItems={controller.selectedSkills}
      groups={controller.expertiseGroups}
      filteredItems={controller.filteredModalExpertiseSkills}
      templateItemIds={controller.templateSkillIds}
      emptyItemName="skills"
      ungroupedTitle="Other Skills"
      itemSingular="Skill"
      isAdding={controller.isAddingExpertise}
      onCancel={controller.handleCancelAddExpertiseSkills}
      onSubmit={controller.handleAddExpertiseSkills}
      onRemoveSelectedItem={controller.handleRemoveSelectedSkill}
      onToggleItem={controller.handleSkillSelect}
      onToggleGroup={controller.handleToggleSelectAllInExpertiseGroup}
      renderItemMeta={(skill) => (
        <span className="text-xs text-muted-foreground">
          Max Score: {skill.maxScore} | Type: {skill.skillType}
        </span>
      )}
    />
  );
}

export function AddPersonalityTraitsSheet({
  controller,
  positionTitle,
}: AddItemsSheetProps): ReactElement {
  return (
    <AddEvaluationItemsSheet
      open={controller.isAddPersonalityModalOpen}
      onOpenChange={controller.setIsAddPersonalityModalOpen}
      title="Add Personality Traits"
      description={`Select multiple traits to add to "${positionTitle}"`}
      sheetId="add-personality-trait-drawer"
      searchPlaceholder="Search traits..."
      searchTerm={controller.modalPersonalitySearchTerm}
      onSearchTermChange={controller.setModalPersonalitySearchTerm}
      selectedItems={controller.selectedTraits}
      groups={controller.personalityGroups}
      filteredItems={controller.filteredModalPersonalityTraits}
      templateItemIds={controller.templateTraitIds}
      emptyItemName="traits"
      ungroupedTitle="Other Traits"
      itemSingular="Trait"
      isAdding={controller.isAddingPersonality}
      onCancel={controller.handleCancelAddPersonalityTraits}
      onSubmit={controller.handleAddPersonalityTraits}
      onRemoveSelectedItem={controller.handleRemoveSelectedTrait}
      onToggleItem={controller.handleTraitSelect}
      onToggleGroup={controller.handleToggleSelectAllInPersonalityGroup}
    />
  );
}

export function ExpertiseEmptyState({
  hasSearchTerm,
  onAdd,
}: EmptyStateProps): ReactElement {
  return (
    <AssignedItemsEmptyState
      actionLabel="Add Skills"
      description="No expertise skills have been assigned to this position yet."
      hasSearchTerm={hasSearchTerm}
      icon={BrainCircuit}
      iconClassName="h-16 w-16 text-muted-foreground mb-6"
      onAdd={onAdd}
      searchDescription="No skills match your search."
      title="No Skills Assigned"
    />
  );
}

export function PersonalityEmptyState({
  hasSearchTerm,
  onAdd,
}: EmptyStateProps): ReactElement {
  return (
    <AssignedItemsEmptyState
      actionLabel="Add First Trait"
      description="No personality traits have been assigned to this position yet."
      hasSearchTerm={hasSearchTerm}
      icon={Target}
      onAdd={onAdd}
      searchDescription="No traits match your search."
      title="No Traits Assigned"
    />
  );
}
