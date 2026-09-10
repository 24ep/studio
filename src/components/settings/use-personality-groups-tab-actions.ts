"use client";

import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-hot-toast";

import {
  addPersonalityTraitToGroup,
  createPersonalityGroup,
  deletePersonalityGroup,
  removePersonalityTraitFromGroup,
  updatePersonalityGroup,
} from "./personality-groups-tab-api";
import type {
  PersonalityGroup,
  PersonalityGroupFormData,
  PersonalityTraitCreateFormData,
} from "./PersonalityGroupsTabTypes";

interface UsePersonalityGroupsTabActionsInput {
  fetchGroups: () => Promise<void>;
  fetchTraits: () => Promise<void>;
  formData: PersonalityGroupFormData;
  resetGroupForm: () => void;
  resetTraitForm: () => void;
  selectedGroup: PersonalityGroup | null;
  setFormData: Dispatch<SetStateAction<PersonalityGroupFormData>>;
  setIsAddTraitDialogOpen: Dispatch<SetStateAction<boolean>>;
  setIsCreateDialogOpen: Dispatch<SetStateAction<boolean>>;
  setIsEditDialogOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedGroup: Dispatch<SetStateAction<PersonalityGroup | null>>;
  traitFormData: PersonalityTraitCreateFormData;
}

export function usePersonalityGroupsTabActions({
  fetchGroups,
  fetchTraits,
  formData,
  resetGroupForm,
  resetTraitForm,
  selectedGroup,
  setFormData,
  setIsAddTraitDialogOpen,
  setIsCreateDialogOpen,
  setIsEditDialogOpen,
  setSelectedGroup,
  traitFormData,
}: UsePersonalityGroupsTabActionsInput) {
  const handleCreateGroup = async () => {
    try {
      await createPersonalityGroup(formData);
      toast.success("Personality group created successfully");
      setIsCreateDialogOpen(false);
      resetGroupForm();
      fetchGroups();
    } catch (error) {
      console.error("Error creating personality group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create personality group");
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      await updatePersonalityGroup(selectedGroup.id, formData);
      toast.success("Personality group updated successfully");
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      resetGroupForm();
      fetchGroups();
    } catch (error) {
      console.error("Error updating personality group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update personality group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this personality group? This will also remove all associated traits.")) {
      return;
    }

    try {
      await deletePersonalityGroup(groupId);
      toast.success("Personality group deleted successfully");
      fetchGroups();
      fetchTraits();
    } catch (error) {
      console.error("Error deleting personality group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete personality group");
    }
  };

  const handleAddTraitToGroup = async () => {
    if (!selectedGroup) return;

    try {
      await addPersonalityTraitToGroup(selectedGroup.id, traitFormData);
      toast.success("Trait added to group successfully");
      setIsAddTraitDialogOpen(false);
      setSelectedGroup(null);
      resetTraitForm();
      fetchTraits();
    } catch (error) {
      console.error("Error adding trait to group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add trait to group");
    }
  };

  const handleRemoveTraitFromGroup = async (traitId: string) => {
    try {
      await removePersonalityTraitFromGroup(traitId);
      toast.success("Trait removed from group successfully");
      fetchTraits();
    } catch (error) {
      console.error("Error removing trait from group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove trait from group");
    }
  };

  const openEditDialog = (group: PersonalityGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color,
    });
    setIsEditDialogOpen(true);
  };

  const openAddTraitDialog = (group: PersonalityGroup) => {
    setSelectedGroup(group);
    setIsAddTraitDialogOpen(true);
  };

  return {
    handleAddTraitToGroup,
    handleCreateGroup,
    handleDeleteGroup,
    handleRemoveTraitFromGroup,
    handleUpdateGroup,
    openAddTraitDialog,
    openEditDialog,
  };
}
