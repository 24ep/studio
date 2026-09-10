"use client";

import React from "react";
import { toast } from "react-hot-toast";

import { useModalSave } from "@/hooks/use-modal-save";
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from "../../lib/response-json";
import type { UserProfile } from "@/lib/types";
import type {
  AppearancePreferences,
  PositionsPreferences,
  SidebarPreferences,
  TaskBoardPreferences,
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";
import {
  DEFAULT_USER_PREFERENCES,
  withSidebarPreferences,
} from "./UserPreferencesModalTypes";

export function useUserPreferencesModal({
  isOpen,
  onOpenChange,
  user,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}) {
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const { isSaving: isModalSaving, save: saveWithModal } = useModalSave(onOpenChange, {
    successMessage: "User preferences updated successfully!",
    errorMessage: "Failed to update user preferences. Please try again.",
    loadingMessage: "Saving preferences...",
    closeModalDelay: 500,
    onSuccess: () => setHasChanges(false),
  });

  const loadUserPreferences = React.useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await readJsonOrFallback<Partial<UserPreferences>>(response, DEFAULT_USER_PREFERENCES);
        setPreferences(withSidebarPreferences(data));
      } else {
        setPreferences(DEFAULT_USER_PREFERENCES);
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      toast.error("Failed to load user preferences");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (isOpen && user) {
      void loadUserPreferences();
    }
  }, [isOpen, loadUserPreferences, user]);

  const updatePreferences = React.useCallback(
    <K extends keyof UserPreferences>(
      key: K,
      updates: Partial<UserPreferences[K]>,
    ) => {
      setPreferences((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            ...updates,
          },
        };
      });
      setHasChanges(true);
    },
    [],
  );

  const save = React.useCallback(async () => {
    if (!user || !preferences) return;

    try {
      await saveWithModal(async () => {
        const response = await fetch(`/api/user-preferences/${user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(getJsonErrorMessage(await readJsonObject(response), "Failed to update user preferences"));
        }
      });
    } catch (error) {
      console.error("Error saving user preferences:", error);
    }
  }, [preferences, saveWithModal, user]);

  const cancel = React.useCallback(() => {
    setHasChanges(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const actions: UserPreferencesActions = {
    cancel,
    save,
    updateAppearancePreferences: (updates: Partial<AppearancePreferences>) =>
      updatePreferences("appearance", updates),
    updatePositionsPreferences: (updates: Partial<PositionsPreferences>) =>
      updatePreferences("positions", updates),
    updateSidebarPreferences: (updates: Partial<SidebarPreferences>) =>
      updatePreferences("sidebar", updates),
    updateTaskBoardPreferences: (updates: Partial<TaskBoardPreferences>) =>
      updatePreferences("taskBoard", updates),
  };

  return {
    actions,
    hasChanges,
    isLoading,
    isModalSaving,
    preferences,
  };
}
