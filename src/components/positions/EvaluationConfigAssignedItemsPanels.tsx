"use client";

import React from "react";
import { BrainCircuit, Target } from "lucide-react";

import { AssignedEvaluationItemsList } from "./EvaluationConfigTabParts";
import {
  AddExpertiseSkillsSheet,
  AddPersonalityTraitsSheet,
  ExpertiseEmptyState,
  PersonalityEmptyState,
} from "./EvaluationConfigAssignedItemPanelStates";
import {
  AssignedPanelShell,
  EvaluationItemsLoadingState,
} from "./EvaluationConfigAssignedPanelParts";
import type { useEvaluationConfigTabController } from "./use-evaluation-config-tab-controller";

type EvaluationConfigController = ReturnType<typeof useEvaluationConfigTabController>;

interface EvaluationAssignedPanelProps {
  controller: EvaluationConfigController;
  isMobile: boolean;
  positionTitle: string;
}

export function ExpertiseSkillsPanel({
  controller,
  isMobile,
  positionTitle,
}: EvaluationAssignedPanelProps): React.ReactElement {
  return (
    <AssignedPanelShell
      assignedCount={controller.positionExpertiseSkills.length}
      icon={BrainCircuit}
      searchPlaceholder="Search assigned skills..."
      searchTerm={controller.expertiseSearchTerm}
      sheet={
        <AddExpertiseSkillsSheet
          controller={controller}
          positionTitle={positionTitle}
        />
      }
      title="Expertise Skills"
      onSearchChange={controller.setExpertiseSearchTerm}
    >
      {controller.isLoadingExpertise ? (
        <EvaluationItemsLoadingState />
      ) : controller.filteredPositionExpertiseSkills.length === 0 ? (
        <ExpertiseEmptyState
          hasSearchTerm={Boolean(controller.expertiseSearchTerm)}
          onAdd={() => controller.setIsAddExpertiseModalOpen(true)}
        />
      ) : (
        <AssignedEvaluationItemsList
          groups={controller.expertiseGroups}
          assignments={controller.filteredPositionExpertiseSkills}
          getItem={(assignment) => assignment.skill}
          getAssignmentId={(assignment) => assignment.id}
          isRequired={(assignment) => assignment.isRequired}
          isMobile={isMobile}
          itemSingular="Skill"
          itemPlural="Skills"
          ungroupedTitle="Ungrouped Skills"
          removingAssignmentId={controller.isRemovingExpertise}
          onRemove={(assignment, event) => (
            controller.handleRemoveExpertiseSkill(assignment.id, assignment.skill.name, event)
          )}
        />
      )}
    </AssignedPanelShell>
  );
}

export function PersonalityTraitsPanel({
  controller,
  isMobile,
  positionTitle,
}: EvaluationAssignedPanelProps): React.ReactElement {
  return (
    <AssignedPanelShell
      assignedCount={controller.positionPersonalityTraits.length}
      icon={Target}
      searchPlaceholder="Search assigned traits..."
      searchTerm={controller.personalitySearchTerm}
      sheet={
        <AddPersonalityTraitsSheet
          controller={controller}
          positionTitle={positionTitle}
        />
      }
      title="Personality Traits"
      onSearchChange={controller.setPersonalitySearchTerm}
    >
      {controller.isLoadingPersonality ? (
        <EvaluationItemsLoadingState />
      ) : controller.filteredPositionPersonalityTraits.length === 0 ? (
        <PersonalityEmptyState
          hasSearchTerm={Boolean(controller.personalitySearchTerm)}
          onAdd={() => controller.setIsAddPersonalityModalOpen(true)}
        />
      ) : (
        <AssignedEvaluationItemsList
          groups={controller.personalityGroups}
          assignments={controller.filteredPositionPersonalityTraits}
          getItem={(assignment) => assignment.trait}
          getAssignmentId={(assignment) => assignment.id}
          isRequired={(assignment) => assignment.isRequired}
          isMobile={isMobile}
          itemSingular="Trait"
          itemPlural="Traits"
          ungroupedTitle="Ungrouped Traits"
          removingAssignmentId={controller.isRemovingPersonality}
          onRemove={(assignment, event) => (
            controller.handleRemovePersonalityTrait(assignment.id, assignment.trait.name, event)
          )}
        />
      )}
    </AssignedPanelShell>
  );
}
