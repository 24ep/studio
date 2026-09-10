import React from 'react';
import { X } from 'lucide-react';
import type { CustomFieldDefinition } from '@/lib/types';

interface CustomFieldAlertDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  definition: CustomFieldDefinition | null;
}

const CustomFieldAlertDialog: React.FC<CustomFieldAlertDialogProps> = ({ open, onConfirm, onCancel, definition }) => {
  if (!open || !definition) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onCancel}
        className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Close delete custom field dialog"
      >
        <X className="h-4 w-4" />
      </button>
      <h2>Delete Custom Field</h2>
      <p>Are you sure you want to delete {definition.label}?</p>
      <button type="button" onClick={onConfirm}>Delete</button>
    </div>
  );
};

export default CustomFieldAlertDialog; 
