"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  UserPreferencesLoadingState,
  UserPreferencesModalFooter,
  UserPreferencesModalHeader,
} from "./UserPreferencesModalParts";
import { UserPreferencesTabs } from "./UserPreferencesModalTabs";
import type { UserPreferencesModalProps } from "./UserPreferencesModalTypes";
import { useUserPreferencesModal } from "./use-user-preferences-modal";

export function UserPreferencesModal({
  isOpen,
  onOpenChange,
  user,
}: UserPreferencesModalProps) {
  const state = useUserPreferencesModal({ isOpen, onOpenChange, user });

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        placement="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-2xl"
        dialogId="user-preferences-drawer"
      >
        <UserPreferencesModalHeader user={user} />

        {state.isLoading ? (
          <UserPreferencesLoadingState />
        ) : state.preferences ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <UserPreferencesTabs
                actions={state.actions}
                preferences={state.preferences}
              />
            </div>
            <UserPreferencesModalFooter
              actions={state.actions}
              hasChanges={state.hasChanges}
              isSaving={state.isModalSaving}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
