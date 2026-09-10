"use client";

import { XMarkIcon as X } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { SheetFooter } from '@/components/ui/sheet';

interface ApplicantSettingsDrawerFooterProps {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onClearError?: () => void;
  onClearSaveError: () => void;
}

export function ApplicantSettingsDrawerFooter({
  error,
  isLoading,
  isSaving,
  onCancel,
  onSave,
  onClearError,
  onClearSaveError,
}: ApplicantSettingsDrawerFooterProps) {
  return (
    <SheetFooter className="border-t pt-4">
      <div className="flex flex-col w-full space-y-3">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 flex items-center justify-between">
            <span>{error}</span>
            {onClearError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearSaveError();
                  onClearError();
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {(isLoading || isSaving) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            {isSaving ? 'Saving settings...' : 'Loading settings...'}
          </div>
        )}

        <div className="flex items-center justify-end w-full">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </SheetFooter>
  );
}
