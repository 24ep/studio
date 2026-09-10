"use client";

import { ArrowPathIcon as Loader2, DocumentCheckIcon as Save } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface FullApplicantDetailEditActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  onCancel: () => void;
}

export function FullApplicantDetailEditActions({
  isEditing,
  isSaving,
}: FullApplicantDetailEditActionsProps) {
  if (!isEditing) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 applicant-edit-buttons" style={{ zIndex: 2000 }}>
      <div className="flex gap-2">
        <Button
          type="submit"
          form="applicant-edit-form"
          disabled={isSaving}
          className="shadow-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
