import { Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SystemPreferencesFormActionsProps {
  isSaving: boolean;
  onCancel?: () => void;
  onSave: () => void;
}

export function SystemPreferencesFormActions({
  isSaving,
  onCancel,
  onSave,
}: SystemPreferencesFormActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={onCancel}>
        <X className="mr-2 h-4 w-4" />
        Cancel
      </Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
