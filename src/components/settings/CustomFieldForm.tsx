import React from 'react';
import type { CustomFieldDefinition } from '@/lib/types';

interface CustomFieldFormProps {
  open: boolean;
  definition: CustomFieldDefinition | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CustomFieldForm: React.FC<CustomFieldFormProps> = ({ open, definition, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      <h2>{definition ? 'Edit' : 'Add'} Custom Field</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default CustomFieldForm; 