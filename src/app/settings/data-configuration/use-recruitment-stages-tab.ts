"use client";

import { useCallback, useEffect, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import { hasAnyPermission } from "@/lib/permissions";
import type { RecruitmentStage } from "@/lib/types";

import {
  deleteRecruitmentStage,
  fetchRecruitmentStages,
  loadRecruitmentStagesFromAppKit,
  migrateRecruitmentStage,
  reorderRecruitmentStages,
  saveRecruitmentStage,
} from "./recruitment-stages-api";
import type { RecruitmentStageFormPayload } from "./recruitment-stages-types";

export function useRecruitmentStagesTab() {
  const { data: session } = useSession();
  const [stages, setStages] = useState<RecruitmentStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<RecruitmentStage | null>(null);
  const [stageToDelete, setStageToDelete] = useState<RecruitmentStage | null>(null);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [replacementStageName, setReplacementStageName] = useState("");
  const [appKitLoad, setAppKitLoad] = useState<{
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null>(null);
  const isImportingAppKit = appKitLoad !== null;

  const canManageStages = hasAnyPermission(session?.user, ["RECRUITMENT_STAGES_EDIT"]);

  const loadStages = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      setStages(await fetchRecruitmentStages());
    } catch (error) {
      setFetchError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageStages) {
      loadStages();
    }
  }, [canManageStages, loadStages]);

  const openModal = useCallback((stage?: RecruitmentStage) => {
    setEditingStage(stage || null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const submitStage = useCallback(async (data: RecruitmentStageFormPayload) => {
    try {
      await saveRecruitmentStage(editingStage?.id ?? null, data);
      toast.success(editingStage ? "Stage updated successfully" : "Stage created successfully");
      setIsModalOpen(false);
      loadStages();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [editingStage, loadStages]);

  const attemptDeleteStage = useCallback(async (stage: RecruitmentStage) => {
    try {
      const result = await deleteRecruitmentStage(stage.id);

      if (result.ok) {
        toast.success("Stage deleted successfully");
        loadStages();
        return;
      }

      if (result.status === 400) {
        toast.error(result.message);
        return;
      }

      if (result.status === 409) {
        setStageToDelete(stage);
        setIsReplacementModalOpen(true);
        return;
      }

      throw new Error(result.message);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [loadStages]);

  const confirmDeleteWithReplacement = useCallback(async () => {
    if (!stageToDelete || !replacementStageName) return;

    try {
      await migrateRecruitmentStage(stageToDelete.id, replacementStageName);
      const deleteResult = await deleteRecruitmentStage(stageToDelete.id);

      if (!deleteResult.ok) {
        throw new Error(deleteResult.message);
      }

      toast.success("Stage deleted successfully");
      setIsReplacementModalOpen(false);
      setStageToDelete(null);
      setReplacementStageName("");
      loadStages();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [loadStages, replacementStageName, stageToDelete]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));

    setStages(updatedItems);

    try {
      await reorderRecruitmentStages(updatedItems.map((item) => item.id));
      toast.success("Stage order updated successfully");
    } catch {
      toast.error("Failed to update stage order");
      loadStages();
    }
  }, [loadStages, stages]);

  const handleReplacementOpenChange = useCallback((open: boolean) => {
    setIsReplacementModalOpen(open);
    if (!open) {
      setStageToDelete(null);
      setReplacementStageName("");
    }
  }, []);

  const handleLoadFromAppKit = useCallback(async (environment: "development" | "production") => {
    try {
      setAppKitLoad({ environment, percent: 10, message: "Initializing AppKit request" });
      await loadRecruitmentStagesFromAppKit(environment);
      setAppKitLoad((current) => current ? { ...current, percent: 45, message: "Downloading stages" } : null);
      setAppKitLoad((current) => current ? { ...current, percent: 70, message: "Applying stages" } : null);
      await loadStages();
      setAppKitLoad((current) => current ? { ...current, percent: 95, message: "Refreshing stage list" } : null);
      toast.success(`Loaded recruitment stages from AppKit ${environment}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setAppKitLoad(null);
    }
  }, [loadStages]);

  return {
    canManageStages,
    stages,
    isLoading,
    fetchError,
    isModalOpen,
    editingStage,
    stageToDelete,
    isReplacementModalOpen,
    appKitLoad,
    isImportingAppKit,
    replacementStageName,
    openModal,
    closeModal,
    submitStage,
    attemptDeleteStage,
    handleDragEnd,
    handleReplacementOpenChange,
    handleLoadFromAppKit,
    setReplacementStageName,
    confirmDeleteWithReplacement,
  };
}
