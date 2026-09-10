"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createSkillTemplate,
  deleteSkillTemplate,
  updateSkillTemplate,
} from "./skill-templates-api";
import {
  buildEmptySkillTemplateFormData,
  buildSkillTemplateFormData,
  type SkillTemplate,
} from "./skill-templates-utils";
import { useSkillTemplatesData } from "./use-skill-templates-data";
import { useSkillTemplateSelectionActions } from "./use-skill-template-selection-actions";

export function useSkillTemplatesTab() {
  const { data, fetchData, loading } = useSkillTemplatesData();
  const [selectedTemplate, setSelectedTemplate] = useState<SkillTemplate | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const createDialogContainerRef = useRef<HTMLDivElement | null>(null);
  const editDialogContainerRef = useRef<HTMLDivElement | null>(null);

  const [isCreateGroupsOpen, setIsCreateGroupsOpen] = useState(false);
  const [isCreatePersonalityOpen, setIsCreatePersonalityOpen] = useState(false);
  const [isEditGroupsOpen, setIsEditGroupsOpen] = useState(false);
  const [isEditPersonalityOpen, setIsEditPersonalityOpen] = useState(false);
  const [expertiseSearch, setExpertiseSearch] = useState("");
  const [personalitySearch, setPersonalitySearch] = useState("");
  const [templateFormData, setTemplateFormData] = useState(buildEmptySkillTemplateFormData);
  const selectionActions = useSkillTemplateSelectionActions({
    data,
    setTemplateFormData,
    templateFormData,
  });

  const resetForm = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateFormData(buildEmptySkillTemplateFormData());
  }, []);

  const closeCreateSelectionPopovers = useCallback(() => {
    setIsCreateGroupsOpen(false);
    setIsCreatePersonalityOpen(false);
  }, []);

  const closeEditSelectionPopovers = useCallback(() => {
    setIsEditGroupsOpen(false);
    setIsEditPersonalityOpen(false);
  }, []);

  const handleCreateTemplate = useCallback(async () => {
    if (!templateFormData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      const result = await createSkillTemplate(templateFormData);

      if (result.ok) {
        toast.success("Skill template created successfully");
        closeCreateSelectionPopovers();
        await fetchData();
        setIsCreateDialogOpen(false);
        resetForm();
        return;
      }

      toast.error(result.message);
      console.error("Error creating template:", result.errorData);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [closeCreateSelectionPopovers, fetchData, resetForm, templateFormData]);

  const handleUpdateTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      const result = await updateSkillTemplate(selectedTemplate.id, templateFormData);

      if (result.ok) {
        toast.success("Skill template updated successfully");
        closeEditSelectionPopovers();
        await fetchData();
        setIsEditDialogOpen(false);
        resetForm();
        return;
      }

      console.error("Error updating template:", result.errorData);
      toast.error(result.message);
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error(`Failed to update template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [closeEditSelectionPopovers, fetchData, resetForm, selectedTemplate, templateFormData]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const result = await deleteSkillTemplate(templateId);

      if (result.ok) {
        toast.success("Skill template deleted successfully");
        await fetchData();
        return;
      }

      toast.error(result.message);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [fetchData]);

  const openEditDialog = useCallback((template: SkillTemplate) => {
    setSelectedTemplate(template);
    setTemplateFormData(buildSkillTemplateFormData(template));
    setIsEditDialogOpen(true);
  }, []);

  const openDetailsDialog = useCallback((template: SkillTemplate) => {
    setSelectedTemplate(template);
    setIsDetailsDialogOpen(true);
  }, []);

  return {
    ...data,
    loading,
    selectedTemplate,
    selectedNames: selectionActions.selectedNames,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDetailsDialogOpen,
    setIsDetailsDialogOpen,
    createDialogContainerRef,
    editDialogContainerRef,
    isCreateGroupsOpen,
    setIsCreateGroupsOpen,
    isCreatePersonalityOpen,
    setIsCreatePersonalityOpen,
    isEditGroupsOpen,
    setIsEditGroupsOpen,
    isEditPersonalityOpen,
    setIsEditPersonalityOpen,
    expertiseSearch,
    setExpertiseSearch,
    personalitySearch,
    setPersonalitySearch,
    templateFormData,
    setTemplateFormData,
    closeCreateSelectionPopovers,
    closeEditSelectionPopovers,
    handleCreateTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
    openEditDialog,
    openDetailsDialog,
    handleGroupToggle: selectionActions.handleGroupToggle,
    handleSkillToggle: selectionActions.handleSkillToggle,
    handlePersonalityGroupToggle: selectionActions.handlePersonalityGroupToggle,
    handlePersonalityTraitToggle: selectionActions.handlePersonalityTraitToggle,
    handleSelectAllExpertiseSkills: selectionActions.handleSelectAllExpertiseSkills,
    handleSelectAllPersonalityTraits: selectionActions.handleSelectAllPersonalityTraits,
  };
}
