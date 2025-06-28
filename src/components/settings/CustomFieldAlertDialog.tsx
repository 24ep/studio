import React from 'react';
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
    <div>
      <h2>Delete Custom Field</h2>
      <p>Are you sure you want to delete {definition.label}?</p>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onConfirm}>Delete</button>
    </div>
  );
};

export default CustomFieldAlertDialog; 