"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  fetchPersonalityGroups,
  fetchPersonalityTraits,
} from "./personality-groups-tab-api";
import {
  defaultPersonalityGroupFormData,
  defaultPersonalityTraitCreateFormData,
  type PersonalityGroup,
  type PersonalityGroupFormData,
  type PersonalityTrait,
  type PersonalityTraitCreateFormData,
} from "./PersonalityGroupsTabTypes";
import { usePersonalityGroupsTabActions } from "./use-personality-groups-tab-actions";

export function usePersonalityGroupsTab() {
  const [groups, setGroups] = useState<PersonalityGroup[]>([]);
  const [traits, setTraits] = useState<PersonalityTrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddTraitDialogOpen, setIsAddTraitDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PersonalityGroup | null>(null);
  const [formData, setFormData] = useState<PersonalityGroupFormData>(defaultPersonalityGroupFormData);
  const [traitFormData, setTraitFormData] = useState<PersonalityTraitCreateFormData>(
    defaultPersonalityTraitCreateFormData,
  );

  const resetGroupForm = () => setFormData(defaultPersonalityGroupFormData);
  const resetTraitForm = () => setTraitFormData(defaultPersonalityTraitCreateFormData);

  const fetchGroups = useCallback(async () => {
    try {
      setGroups(await fetchPersonalityGroups());
    } catch (error) {
      console.error("Error fetching personality groups:", error);
      toast.error("Failed to fetch personality groups");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTraits = useCallback(async () => {
    try {
      setTraits(await fetchPersonalityTraits());
    } catch (error) {
      console.error("Error fetching personality traits:", error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchTraits();
  }, [fetchGroups, fetchTraits]);

  const actions = usePersonalityGroupsTabActions({
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
  });

  return {
    formData,
    groups,
    handleAddTraitToGroup: actions.handleAddTraitToGroup,
    handleCreateGroup: actions.handleCreateGroup,
    handleDeleteGroup: actions.handleDeleteGroup,
    handleRemoveTraitFromGroup: actions.handleRemoveTraitFromGroup,
    handleUpdateGroup: actions.handleUpdateGroup,
    isAddTraitDialogOpen,
    isCreateDialogOpen,
    isEditDialogOpen,
    loading,
    openAddTraitDialog: actions.openAddTraitDialog,
    openEditDialog: actions.openEditDialog,
    selectedGroup,
    setFormData,
    setIsAddTraitDialogOpen,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setTraitFormData,
    traitFormData,
    traits,
  };
}
