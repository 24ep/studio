"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "@/lib/response-json";

import {
  defaultPersonalityTraitFormData,
  type PersonalityGroup,
  type PersonalityTrait,
  type PersonalityTraitFormData,
} from "./PersonalityTraitsTabTypes";
import { getSettingsErrorMessage } from "./settings-error-message-utils";

export function usePersonalityTraitsTab() {
  const [traits, setTraits] = useState<PersonalityTrait[]>([]);
  const [groups, setGroups] = useState<PersonalityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrait, setSelectedTrait] = useState<PersonalityTrait | null>(null);
  const [formData, setFormData] = useState<PersonalityTraitFormData>(defaultPersonalityTraitFormData);

  const resetForm = () => {
    setFormData(defaultPersonalityTraitFormData);
  };

  const fetchTraits = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/personality-traits");
      if (response.ok) {
        setTraits(await readJsonOrFallback<PersonalityTrait[]>(response, []));
      }
    } catch (error) {
      console.error("Error fetching personality traits:", error);
      toast.error("Failed to fetch personality traits");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/personality-groups");
      if (response.ok) {
        setGroups(await readJsonOrFallback<PersonalityGroup[]>(response, []));
      }
    } catch (error) {
      console.error("Error fetching personality groups:", error);
    }
  };

  useEffect(() => {
    fetchTraits();
    fetchGroups();
  }, []);

  const handleCreateTrait = async () => {
    try {
      const response = await fetch("/api/v1/evaluation/personality-traits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId || null,
        }),
      });

      if (response.ok) {
        toast.success("Personality trait created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchTraits();
      } else {
        const error = await readJsonOrFallback<{ message?: string; error?: string }>(
          response,
          { error: "Failed to create personality trait" }
        );
        console.error("Error creating personality trait:", error);
        toast.error(getSettingsErrorMessage(error, "Failed to create personality trait"));
      }
    } catch (error) {
      console.error("Error creating personality trait:", error);
      toast.error("Failed to create personality trait");
    }
  };

  const handleUpdateTrait = async () => {
    if (!selectedTrait) return;

    try {
      const response = await fetch(`/api/v1/evaluation/personality-traits/${selectedTrait.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId || null,
        }),
      });

      if (response.ok) {
        toast.success("Personality trait updated successfully");
        setIsEditDialogOpen(false);
        setSelectedTrait(null);
        resetForm();
        fetchTraits();
      } else {
        const error = await readJsonOrFallback<{ message?: string; error?: string }>(
          response,
          { error: "Failed to update personality trait" }
        );
        console.error("Error updating personality trait:", error);
        toast.error(getSettingsErrorMessage(error, "Failed to update personality trait"));
      }
    } catch (error) {
      console.error("Error updating personality trait:", error);
      toast.error("Failed to update personality trait");
    }
  };

  const handleDeleteTrait = async (traitId: string) => {
    if (!confirm("Are you sure you want to delete this personality trait?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/evaluation/personality-traits/${traitId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Personality trait deleted successfully");
        fetchTraits();
      } else {
        toast.error(getJsonErrorMessage(await readJsonObject(response), "Failed to delete personality trait"));
      }
    } catch (error) {
      console.error("Error deleting personality trait:", error);
      toast.error("Failed to delete personality trait");
    }
  };

  const handleToggleActive = async (traitId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/v1/evaluation/personality-traits/${traitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        toast.success(`Trait ${!isActive ? "activated" : "deactivated"} successfully`);
        fetchTraits();
      } else {
        toast.error(getJsonErrorMessage(await readJsonObject(response), "Failed to update trait status"));
      }
    } catch (error) {
      console.error("Error updating trait status:", error);
      toast.error("Failed to update trait status");
    }
  };

  const openEditDialog = (trait: PersonalityTrait) => {
    setSelectedTrait(trait);
    setFormData({
      name: trait.name,
      description: trait.description || "",
      shortDescription: trait.shortDescription || "",
      groupId: trait.groupId || "",
    });
    setIsEditDialogOpen(true);
  };

  return {
    formData,
    groups,
    handleCreateTrait,
    handleDeleteTrait,
    handleToggleActive,
    handleUpdateTrait,
    isCreateDialogOpen,
    isEditDialogOpen,
    loading,
    openEditDialog,
    selectedTrait,
    setFormData,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    traits,
  };
}
