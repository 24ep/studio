"use client";

import { useCallback, useEffect, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { toast } from 'react-hot-toast';
import type { RecruitmentStage } from '@/lib/types';
import type { RecruitmentStageFormValues } from './RecruitmentStagesPageView';
import {
  deleteRecruitmentStage,
  fetchRecruitmentStages,
  fetchShowLogoOnlySetting,
  migrateRecruitmentStage,
  reorderRecruitmentStageIds,
  saveRecruitmentStage,
} from './recruitment-stages-api';
import {
  getRecruitmentStageDeleteDecision,
  getRecruitmentStagesErrorMessage,
  getStageSaveSuccessMessage,
  hasReplacementStageSelection,
  reorderRecruitmentStages,
  resetReplacementStageState,
} from './recruitment-stages-page-utils';

export function useRecruitmentStagesPageController() {
  const { data: session, status: sessionStatus } = useSession() as {
    data: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };
  const router = useRouter();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/stages';

  const [showLogoOnly, setShowLogoOnly] = useState(false);
  const [stages, setStages] = useState<RecruitmentStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<RecruitmentStage | null>(null);
  const [stageToDelete, setStageToDelete] = useState<RecruitmentStage | null>(null);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [replacementStageName, setReplacementStageName] = useState('');

  const refreshStages = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    setIsLoading(true);
    setFetchError(null);

    try {
      setStages(await fetchRecruitmentStages());
    } catch (error) {
      setFetchError(getRecruitmentStagesErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
      return;
    }

    if (sessionStatus === 'authenticated') {
      void refreshStages();
    }
  }, [sessionStatus, currentPath, refreshStages]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    const loadLogoSetting = async () => {
      try {
        setShowLogoOnly(await fetchShowLogoOnlySetting());
      } catch (error) {
        console.error('Error fetching showLogoOnly setting:', error);
      }
    };

    void loadLogoSetting();
  }, [sessionStatus]);

  const handleOpenModal = (stage?: RecruitmentStage) => {
    setEditingStage(stage || null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: RecruitmentStageFormValues) => {
    try {
      await saveRecruitmentStage(editingStage?.id || null, data);
      toast.success(getStageSaveSuccessMessage(editingStage));
      setIsModalOpen(false);
      await refreshStages();
    } catch (error) {
      toast.error(getRecruitmentStagesErrorMessage(error));
    }
  };

  const attemptDeleteStage = async (stage: RecruitmentStage) => {
    try {
      const result = await deleteRecruitmentStage(stage.id);
      const decision = getRecruitmentStageDeleteDecision(result);

      if (decision.type === 'deleted') {
        toast.success('Stage deleted successfully');
        await refreshStages();
        return;
      }

      if (decision.type === 'validation-error') {
        toast.error(decision.message);
        return;
      }

      if (decision.type === 'needs-replacement') {
        setStageToDelete(stage);
        setIsReplacementModalOpen(true);
        return;
      }

      throw new Error(decision.message);
    } catch (error) {
      toast.error(getRecruitmentStagesErrorMessage(error));
    }
  };

  const handleConfirmDeleteWithReplacement = async () => {
    if (!hasReplacementStageSelection(stageToDelete, replacementStageName)) return;

    try {
      await migrateRecruitmentStage(stageToDelete.id, replacementStageName);
      const deleteResult = await deleteRecruitmentStage(stageToDelete.id);

      if (!deleteResult.ok) {
        throw new Error(deleteResult.message || 'Failed to delete stage');
      }

      toast.success('Stage deleted successfully');
      setIsReplacementModalOpen(false);
      setStageToDelete(null);
      setReplacementStageName('');
      await refreshStages();
    } catch (error) {
      toast.error(getRecruitmentStagesErrorMessage(error));
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const reorder = reorderRecruitmentStages(stages, result);
    if (!reorder) return;

    setStages(reorder.stages);

    try {
      await reorderRecruitmentStageIds(reorder.stageIds);
      toast.success('Stage order updated successfully');
    } catch {
      toast.error('Failed to update stage order');
      await refreshStages();
    }
  };

  const handleReplacementOpenChange = (open: boolean) => {
    setIsReplacementModalOpen(open);
    if (!open) {
      const reset = resetReplacementStageState();
      setStageToDelete(reset.stageToDelete);
      setReplacementStageName(reset.replacementStageName);
    }
  };

  return {
    editingStage,
    fetchError,
    goToDashboard: () => router.push('/'),
    handleConfirmDeleteWithReplacement,
    handleDragEnd,
    handleFormSubmit,
    handleOpenModal,
    handleReplacementOpenChange,
    isInitialLoading: sessionStatus === 'loading' || (isLoading && !fetchError && stages.length === 0),
    isLoading,
    isModalOpen,
    isPermissionError: fetchError === 'You do not have permission to manage recruitment stages.',
    isReplacementModalOpen,
    replacementStageName,
    setIsModalOpen,
    setReplacementStageName,
    showLogoOnly,
    stageToDelete,
    stages,
    attemptDeleteStage,
  };
}
