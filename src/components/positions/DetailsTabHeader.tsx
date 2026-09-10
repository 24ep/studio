import { Button } from '@/components/ui/button';
import { Edit, Loader2, Save, XCircle } from 'lucide-react';

export interface DetailsTabHeaderProps {
  isEditMode: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onEdit: () => void;
}

export function DetailsTabHeader({
  isEditMode,
  isSaving,
  onCancel,
  onEdit,
}: DetailsTabHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-foreground">Position details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Core details and configuration for this position.</p>
      </div>
      {!isEditMode ? (
        <Button variant="outline" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
