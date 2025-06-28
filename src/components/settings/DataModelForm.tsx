import React from 'react';

interface DataModelFormProps {
  open: boolean;
  definition: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const DataModelForm: React.FC<DataModelFormProps> = ({ open, definition, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      {/* Data Model Form UI here */}
      <h2>Data Model Form</h2>
    </div>
  );
};

export default DataModelForm; 