import React from 'react';

interface ApiDocsFormProps {
  open: boolean;
  doc: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ApiDocsForm: React.FC<ApiDocsFormProps> = ({ open, doc, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      <h2>API Docs Form</h2>
      {/* API docs form UI here */}
    </div>
  );
};

export default ApiDocsForm; 