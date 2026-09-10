import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CustomizeBoardModalFooterProps } from './CustomizeBoardModalTypes';
import { useLocalization } from '@/contexts/LocalizationContext';

export function CustomizeBoardModalHeader() {
  const { t } = useLocalization();

  return (
    <DialogHeader className="p-6 pb-0 border-b flex-shrink-0 bg-card rounded-t-xl">
      <DialogTitle className="flex items-center gap-2 text-2xl">
        <Settings className="w-6 h-6" />
        {t("tasks.customizeBoard.title", "Customize Board Layout")}
      </DialogTitle>
      <DialogDescription className="text-base mt-2">
        {t(
          "tasks.customizeBoard.description",
          "Configure how your task board is organized and which fields are visible on each card.",
        )}
      </DialogDescription>
    </DialogHeader>
  );
}

export function CustomizeBoardModalFooter({
  disabled,
  initializing,
  loading,
  onCancel,
  onSave,
}: CustomizeBoardModalFooterProps) {
  const { t } = useLocalization();

  return (
    <DialogFooter className="mt-auto  bottom-0 left-0 right-0 bg-card border-t p-4 flex-shrink-0 rounded-b-xl z-10">
      <div className="flex items-center justify-between w-full">
        <div className="text-xs text-muted-foreground">
          {t("tasks.customizeBoard.notice", "Changes will be applied immediately to your board")}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            {t("tasks.filters.cancel", "Cancel")}
          </Button>
          <Button
            onClick={onSave}
            disabled={disabled}
            className="min-w-[100px]"
          >
            <SaveButtonLabel initializing={initializing} loading={loading} localize={t} />
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
}

function SaveButtonLabel({
  initializing,
  loading,
  localize,
}: {
  initializing: boolean;
  loading: boolean;
  localize: (key: string, fallback: string) => string;
}) {
  if (loading) {
    return (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
        {localize("tasks.customizeBoard.saving", "Saving...")}
      </>
    );
  }

  if (initializing) {
    return (
      <>
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
        {localize("common.loading", "Loading...")}
      </>
    );
  }

  return localize("tasks.customizeBoard.save", "Save Changes");
}
