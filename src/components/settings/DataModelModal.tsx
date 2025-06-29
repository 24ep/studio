import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Database } from 'lucide-react';
import DataModelForm from './DataModelForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { DataModel } from '@/lib/types';

interface DataModelModalProps {
  onDataModelUpdate?: (dataModel: DataModel) => void;
}

const DataModelModal: React.FC<DataModelModalProps> = ({ onDataModelUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (dataModel: DataModel) => {
    if (onDataModelUpdate) {
      onDataModelUpdate(dataModel);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="mb-4"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Data Model
      </Button>

      <DataModelForm
        open={isOpen}
        dataModel={null}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default DataModelModal; 