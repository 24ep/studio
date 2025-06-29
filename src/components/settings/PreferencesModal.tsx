import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Palette } from 'lucide-react';
import PreferencesForm from './PreferencesForm';

interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string;
  modelType?: 'Candidate' | 'Position';
  attributeKey?: string;
  uiPreference?: 'Standard' | 'Emphasized' | 'Hidden';
  customNote?: string;
}

interface PreferencesModalProps {
  onPreferenceUpdate?: (preference: UserPreference) => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ onPreferenceUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (data: UserPreference) => {
    if (onPreferenceUpdate) {
      onPreferenceUpdate(data);
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
        Add New Preference
      </Button>

      <PreferencesForm
        open={isOpen}
        preference={null}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default PreferencesModal; 