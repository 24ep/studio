"use client";

import { Cog6ToothIcon as Settings } from '@heroicons/react/24/outline';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useJobMatchFeature } from '@/hooks/useJobMatchFeature';
import type { ApplicantSettings } from './applicant-settings-types';
import { ApplicantSettingsDrawerColumns } from './ApplicantSettingsDrawerColumns';
import { ApplicantSettingsDrawerFooter } from './ApplicantSettingsDrawerFooter';
import { ApplicantSettingsDrawerOptions } from './ApplicantSettingsDrawerOptions';
import { useApplicantSettingsDrawerController } from './use-applicant-settings-drawer-controller';

interface ApplicantSettingsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange: (settings: ApplicantSettings) => Promise<void>;
  currentSettings?: ApplicantSettings;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export function ApplicantSettingsDrawer({
  isOpen,
  onOpenChange,
  onSettingsChange,
  currentSettings,
  isLoading = false,
  error = null,
  onClearError,
}: ApplicantSettingsDrawerProps) {
  const { isJobMatchEnabled } = useJobMatchFeature();
  const controller = useApplicantSettingsDrawerController({
    currentSettings,
    onOpenChange,
    onSettingsChange,
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto" sheetId="applicant-settings-drawer">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <SheetTitle>Applicant Page Settings</SheetTitle>
            </div>
          </div>
          <SheetDescription>
            Configure which columns to display in the Applicant table and filter options.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <ApplicantSettingsDrawerColumns
            settings={controller.localSettings}
            isJobMatchEnabled={isJobMatchEnabled}
            onSettingChange={controller.handleSettingChange}
            onDragEnd={controller.handleDragEnd}
          />
          <Separator />
          <ApplicantSettingsDrawerOptions
            settings={controller.localSettings}
            isJobMatchEnabled={isJobMatchEnabled}
            onSettingChange={controller.handleSettingChange}
          />
        </div>
        <Separator />
        <ApplicantSettingsDrawerFooter
          error={error || controller.saveError}
          isLoading={isLoading}
          isSaving={controller.isSaving}
          onCancel={controller.handleCancel}
          onSave={controller.handleSave}
          onClearError={onClearError}
          onClearSaveError={controller.clearSaveError}
        />
      </SheetContent>
    </Sheet>
  );
}
