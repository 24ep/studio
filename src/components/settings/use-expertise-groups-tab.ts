"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  createExpertiseGroup,
  createExpertiseSkillForGroup,
  deleteExpertiseGroup,
  fetchExpertiseGroups,
  fetchExpertiseSkills,
  removeExpertiseSkillFromGroup,
  updateExpertiseGroup,
} from "./expertise-groups-api";
import {
  defaultExpertiseGroupFormData,
  defaultExpertiseSkillCreateFormData,
  type ExpertiseGroup,
  type ExpertiseGroupFormData,
  type ExpertiseSkill,
  type ExpertiseSkillCreateFormData,
} from "./ExpertiseGroupsTabTypes";

export function useExpertiseGroupsTab() {
  const [groups, setGroups] = useState<ExpertiseGroup[]>([]);
  const [skills, setSkills] = useState<ExpertiseSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddSkillDialogOpen, setIsAddSkillDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExpertiseGroup | null>(null);
  const [formData, setFormData] = useState<ExpertiseGroupFormData>(defaultExpertiseGroupFormData);
  const [skillFormData, setSkillFormData] = useState<ExpertiseSkillCreateFormData>(
    defaultExpertiseSkillCreateFormData,
  );

  const resetGroupForm = () => setFormData(defaultExpertiseGroupFormData);
  const resetSkillForm = () => setSkillFormData(defaultExpertiseSkillCreateFormData);

  const fetchGroups = async () => {
    try {
      setGroups(await fetchExpertiseGroups());
    } catch (error) {
      console.error("Error fetching expertise groups:", error);
      toast.error("Failed to fetch expertise groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      setSkills(await fetchExpertiseSkills());
    } catch (error) {
      console.error("Error fetching expertise skills:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchSkills();
  }, []);

  const handleCreateGroup = async () => {
    try {
      await createExpertiseGroup(formData);
      toast.success("Expertise group created successfully");
      setIsCreateDialogOpen(false);
      resetGroupForm();
      fetchGroups();
    } catch (error) {
      console.error("Error creating expertise group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create expertise group");
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      await updateExpertiseGroup(selectedGroup.id, formData);
      toast.success("Expertise group updated successfully");
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      resetGroupForm();
      fetchGroups();
    } catch (error) {
      console.error("Error updating expertise group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update expertise group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this expertise group? This will also remove all associated skills.")) {
      return;
    }

    try {
      await deleteExpertiseGroup(groupId);
      toast.success("Expertise group deleted successfully");
      fetchGroups();
      fetchSkills();
    } catch (error) {
      console.error("Error deleting expertise group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete expertise group");
    }
  };

  const handleAddSkillToGroup = async () => {
    if (!selectedGroup) return;

    try {
      await createExpertiseSkillForGroup(selectedGroup.id, skillFormData);
      toast.success("Skill added to group successfully");
      setIsAddSkillDialogOpen(false);
      setSelectedGroup(null);
      resetSkillForm();
      fetchSkills();
    } catch (error) {
      console.error("Error adding skill to group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add skill to group");
    }
  };

  const handleRemoveSkillFromGroup = async (skillId: string) => {
    try {
      await removeExpertiseSkillFromGroup(skillId);
      toast.success("Skill removed from group successfully");
      fetchSkills();
    } catch (error) {
      console.error("Error removing skill from group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove skill from group");
    }
  };

  const openEditDialog = (group: ExpertiseGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color,
    });
    setIsEditDialogOpen(true);
  };

  const openAddSkillDialog = (group: ExpertiseGroup) => {
    setSelectedGroup(group);
    setIsAddSkillDialogOpen(true);
  };

  return {
    formData,
    groups,
    handleAddSkillToGroup,
    handleCreateGroup,
    handleDeleteGroup,
    handleRemoveSkillFromGroup,
    handleUpdateGroup,
    isAddSkillDialogOpen,
    isCreateDialogOpen,
    isEditDialogOpen,
    loading,
    openAddSkillDialog,
    openEditDialog,
    selectedGroup,
    setFormData,
    setIsAddSkillDialogOpen,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setSkillFormData,
    skillFormData,
    skills,
  };
}
