"use client";

import { useEffect, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";

import {
  createDefaultHeadcountTypeOption,
  type HeadcountTypeOption,
} from "./headcount-types-tab-types";
import { readJsonOrFallback } from "@/lib/response-json";

const HEADCOUNT_TYPES_ENDPOINT = "/api/settings/headcount-types";

function normalizeHeadcountTypeOptions(value: unknown): HeadcountTypeOption[] {
  return Array.isArray(value) ? value as HeadcountTypeOption[] : [];
}

async function saveHeadcountTypeOptions(options: HeadcountTypeOption[], errorMessage: string) {
  const response = await fetch(HEADCOUNT_TYPES_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ options }),
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }
}

export function useHeadcountTypesTab() {
  const [options, setOptions] = useState<HeadcountTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<HeadcountTypeOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHeadcountTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(HEADCOUNT_TYPES_ENDPOINT);
      if (!response.ok) {
        throw new Error("Failed to fetch headcount types");
      }

      setOptions(normalizeHeadcountTypeOptions(await readJsonOrFallback<unknown>(response, [])));
    } catch (error) {
      console.error("Error fetching headcount types:", error);
      setError("Failed to load headcount types");
      toast.error("Failed to load headcount types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadcountTypes();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
  };

  const handleAddOption = () => {
    setEditingOption(createDefaultHeadcountTypeOption(options.length + 1));
    setIsModalOpen(true);
  };

  const handleEditOption = (option: HeadcountTypeOption) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleDeleteOption = async (value: string) => {
    if (!confirm("Are you sure you want to delete this headcount type?")) {
      return;
    }

    const updatedOptions = options.filter((option) => option.value !== value);
    setOptions(updatedOptions);

    try {
      await saveHeadcountTypeOptions(updatedOptions, "Failed to delete headcount type");
      toast.success("Headcount type deleted successfully");
    } catch (error) {
      console.error("Error deleting headcount type:", error);
      toast.error("Failed to delete headcount type");
      fetchHeadcountTypes();
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(options);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));

    setOptions(updatedItems);

    try {
      await saveHeadcountTypeOptions(updatedItems, "Failed to update sort order");
      toast.success("Order updated successfully");
    } catch (error) {
      console.error("Error updating sort order:", error);
      toast.error("Failed to update sort order");
      fetchHeadcountTypes();
    }
  };

  const handleToggleActive = async (value: string) => {
    const updatedOptions = options.map((option) =>
      option.value === value ? { ...option, isActive: !option.isActive } : option
    );

    setOptions(updatedOptions);

    try {
      await saveHeadcountTypeOptions(updatedOptions, "Failed to update headcount type");
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating headcount type:", error);
      toast.error("Failed to update status");
      fetchHeadcountTypes();
    }
  };

  const handleSaveOption = async (updatedOption: HeadcountTypeOption) => {
    const isNew = !options.find((option) => option.value === updatedOption.value);
    const updatedOptions = isNew
      ? [...options, updatedOption]
      : options.map((option) => option.value === editingOption?.value ? updatedOption : option);

    setOptions(updatedOptions);

    try {
      await saveHeadcountTypeOptions(updatedOptions, "Failed to save headcount type");
      toast.success("Headcount type saved successfully");
      closeModal();
    } catch (error) {
      console.error("Error saving headcount type:", error);
      toast.error("Failed to save headcount type");
      fetchHeadcountTypes();
    }
  };

  return {
    closeModal,
    editingOption,
    error,
    handleAddOption,
    handleDeleteOption,
    handleDragEnd,
    handleEditOption,
    handleSaveOption,
    handleToggleActive,
    isModalOpen,
    loading,
    options,
  };
}
