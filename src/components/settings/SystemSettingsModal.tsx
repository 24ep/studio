import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SystemSettingsForm from './SystemSettingsForm';
import type { SystemSetting } from "@/lib/types";

interface SystemSettingsModalProps {
  onSettingsUpdate?: (settings: SystemSetting[]) => void;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ onSettingsUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (data: SystemSetting[]) => {
    if (onSettingsUpdate) {
      onSettingsUpdate(data);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="mb-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Setting
      </Button>

      <SystemSettingsForm
        open={isOpen}
        setting={null}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default SystemSettingsModal; 