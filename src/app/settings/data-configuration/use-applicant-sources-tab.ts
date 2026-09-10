"use client";

import { useCallback, useEffect, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";

import type { ApplicantSource } from "@/lib/types";

import {
  deleteApplicantSource,
  fetchApplicantSources,
  loadApplicantSourcesFromAppKit,
  reorderApplicantSourceList,
  reorderApplicantSources,
} from "./applicant-sources-tab-api";
import {
  applyApplicantSourceSaveResult,
  getApplicantSourceErrorMessage,
  isApplicantSourceNetworkError,
  saveApplicantSource,
  type ApplicantSourceSettingsFormData,
} from "./applicant-source-settings-utils";

export function useApplicantSourcesTab() {
  const [sources, setSources] = useState<ApplicantSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ApplicantSource | null>(null);
  const [sourceToDelete, setSourceToDelete] = useState<ApplicantSource | null>(null);
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null>(null);
  const isImportingAppKit = appKitLoad !== null;

  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      setSources(await fetchApplicantSources());
    } catch (error) {
      console.error("Failed to fetch sources:", error);
      setFetchError(getApplicantSourceErrorMessage(error, "Failed to fetch sources"));
      toast.error("Failed to load Applicant sources");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const openCreateModal = () => {
    setEditingSource(null);
    setIsModalOpen(true);
  };

  const openEditModal = (source: ApplicantSource) => {
    setEditingSource(source);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSource(null);
  };

  const handleDeleteSelected = async () => {
    if (!sourceToDelete) {
      return;
    }

    try {
      await deleteApplicantSource(sourceToDelete.id);
      setSources((prev) => prev.filter((source) => source.id !== sourceToDelete.id));
      toast.success("Applicant source deleted successfully");
      setSourceToDelete(null);
    } catch (error) {
      console.error("Failed to delete source:", error);
      toast.error(getApplicantSourceErrorMessage(error, "Failed to delete Applicant source"));
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const updatedSources = reorderApplicantSourceList(
      sources,
      result.source.index,
      result.destination.index,
    );
    setSources(updatedSources);

    try {
      const errorMessage = await reorderApplicantSources(
        updatedSources.map((source) => source.id),
      );

      if (errorMessage) {
        toast.error(errorMessage);
        fetchSources();
        return;
      }

      toast.success("Source order updated successfully");
    } catch (error) {
      console.error("Failed to reorder:", error);
      toast.error(
        isApplicantSourceNetworkError(error)
          ? "Network error: Please check your connection and try again."
          : "Failed to update source order",
      );
      fetchSources();
    }
  };

  const handleLoadFromAppKit = async (environment: "development" | "production") => {
    try {
      setAppKitLoad({ environment, percent: 10, message: "Initializing AppKit request" });
      await loadApplicantSourcesFromAppKit(environment);
      setAppKitLoad((current) => current ? { ...current, percent: 45, message: "Downloading seed data" } : null);
      setAppKitLoad((current) => current ? { ...current, percent: 70, message: "Applying changes" } : null);
      await fetchSources();
      setAppKitLoad((current) => current ? { ...current, percent: 95, message: "Refreshing list" } : null);
      toast.success(`Loaded Applicant sources from AppKit ${environment}`);
    } catch (error) {
      console.error("Failed to load Applicant sources from AppKit:", error);
      toast.error(getApplicantSourceErrorMessage(error, "Failed to load Applicant sources from AppKit"));
    } finally {
      setAppKitLoad(null);
    }
  };

  const handleModalSubmit = async (data: ApplicantSourceSettingsFormData) => {
    try {
      const result = await saveApplicantSource(data, editingSource);
      setSources((prev) => applyApplicantSourceSaveResult(prev, result));
      toast.success(
        result.mode === "update"
          ? "Applicant source updated successfully"
          : "Applicant source created successfully",
      );
      closeModal();
    } catch (error) {
      console.error("Failed to save source:", error);
      toast.error(getApplicantSourceErrorMessage(error, "Failed to save Applicant source"));
    }
  };

  return {
    sources,
    isLoading,
    fetchError,
    isModalOpen,
    editingSource,
    sourceToDelete,
    appKitLoad,
    isImportingAppKit,
    fetchSources,
    openCreateModal,
    openEditModal,
    closeModal,
    handleModalSubmit,
    handleDeleteSelected,
    handleLoadFromAppKit,
    setSourceToDelete,
    handleDragEnd,
  };
}
