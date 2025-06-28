import React from 'react';
import type { CustomFieldDefinition } from '@/lib/types';

interface CustomFieldTableProps {
  fields: CustomFieldDefinition[];
  isLoading?: boolean;
  onEdit?: (field: CustomFieldDefinition) => void;
  onDelete?: (field: CustomFieldDefinition) => void;
}

const CustomFieldTable: React.FC<CustomFieldTableProps> = ({ fields, isLoading, onEdit, onDelete }) => {
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <h2>Custom Field Table</h2>
      <ul>
        {fields.map(field => (
          <li key={field.id}>
            {field.label} ({field.field_type})
            <button onClick={() => onEdit && onEdit(field)}>Edit</button>
            <button onClick={() => onDelete && onDelete(field)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomFieldTable; 