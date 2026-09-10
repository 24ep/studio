"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "@/lib/response-json";

import {
  defaultExpertiseSkillFormData,
  type ExpertiseGroup,
  type ExpertiseSkill,
  type ExpertiseSkillFormData,
} from "./ExpertiseSkillsTabTypes";
import { getSettingsErrorMessage } from "./settings-error-message-utils";

export function useExpertiseSkillsTab() {
  const [skills, setSkills] = useState<ExpertiseSkill[]>([]);
  const [groups, setGroups] = useState<ExpertiseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<ExpertiseSkill | null>(null);
  const [formData, setFormData] = useState<ExpertiseSkillFormData>(defaultExpertiseSkillFormData);

  const resetForm = () => {
    setFormData(defaultExpertiseSkillFormData);
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/expertise-skills");
      if (response.ok) {
        setSkills(await readJsonOrFallback<ExpertiseSkill[]>(response, []));
      }
    } catch (error) {
      console.error("Error fetching expertise skills:", error);
      toast.error("Failed to fetch expertise skills");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/expertise-groups");
      if (response.ok) {
        setGroups(await readJsonOrFallback<ExpertiseGroup[]>(response, []));
      }
    } catch (error) {
      console.error("Error fetching expertise groups:", error);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchGroups();
  }, []);

  const handleCreateSkill = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/expertise-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId || null,
        }),
      });

      if (response.ok) {
        toast.success("Expertise skill created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchSkills();
      } else {
        const error = await readJsonOrFallback<{ message?: string; error?: string; details?: Array<{ message?: string }> }>(
          response,
          { error: "Failed to create expertise skill" }
        );
        console.error("Error creating expertise skill:", error);
        toast.error(getSettingsErrorMessage(error, "Failed to create expertise skill"));
      }
    } catch (error) {
      console.error("Error creating expertise skill:", error);
      toast.error("Failed to create expertise skill");
    }
  };

  const handleUpdateSkill = async () => {
    if (!selectedSkill) return;

    try {
      const response = await fetch(`/api/v1/evaluation/expertise-skills/${selectedSkill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || undefined,
          description: formData.description || null,
          maxScore: formData.maxScore || undefined,
          skillType: formData.skillType || undefined,
          groupId: formData.groupId || null,
        }),
      });

      if (response.ok) {
        toast.success("Expertise skill updated successfully");
        setIsEditDialogOpen(false);
        setSelectedSkill(null);
        resetForm();
        fetchSkills();
      } else {
        const error = await readJsonOrFallback<{ message?: string; error?: string; details?: Array<{ message?: string }> }>(
          response,
          { error: "Failed to update expertise skill" }
        );
        console.error("Error updating expertise skill:", error);
        toast.error(getSettingsErrorMessage(error, "Failed to update expertise skill"));
      }
    } catch (error) {
      console.error("Error updating expertise skill:", error);
      toast.error("Failed to update expertise skill");
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm("Are you sure you want to delete this expertise skill?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/evaluation/expertise-skills/${skillId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Expertise skill deleted successfully");
        fetchSkills();
      } else {
        toast.error(getJsonErrorMessage(await readJsonObject(response), "Failed to delete expertise skill"));
      }
    } catch (error) {
      console.error("Error deleting expertise skill:", error);
      toast.error("Failed to delete expertise skill");
    }
  };

  const handleToggleActive = async (skillId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/v1/evaluation/expertise-skills/${skillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Skill ${!isActive ? "activated" : "deactivated"} successfully`);
        fetchSkills();
      } else {
        toast.error(getJsonErrorMessage(await readJsonObject(response), "Failed to update skill status"));
      }
    } catch (error) {
      console.error("Error updating skill status:", error);
      toast.error("Failed to update skill status");
    }
  };

  const openEditDialog = (skill: ExpertiseSkill) => {
    setSelectedSkill(skill);
    setFormData({
      name: skill.name,
      description: skill.description || "",
      maxScore: skill.maxScore,
      skillType: skill.skillType,
      groupId: skill.groupId || "",
    });
    setIsEditDialogOpen(true);
  };

  return {
    skills,
    groups,
    loading,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedSkill,
    formData,
    setFormData,
    handleCreateSkill,
    handleUpdateSkill,
    handleDeleteSkill,
    handleToggleActive,
    openEditDialog,
  };
}
