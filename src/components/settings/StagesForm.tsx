import React from 'react';

interface StagesFormProps {
  open: boolean;
  stage: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const StagesForm: React.FC<StagesFormProps> = ({ open, stage, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      <h2>Stages Form</h2>
      {/* Stages form UI here */}
    </div>
  );
};

export default StagesForm; 