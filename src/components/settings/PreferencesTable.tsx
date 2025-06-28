import React from 'react';

interface PreferencesTableProps {
  preferences: any[];
  isLoading: boolean;
  onEdit: (preference: any) => void;
}

const PreferencesTable: React.FC<PreferencesTableProps> = ({ preferences, isLoading, onEdit }) => {
  return (
    <div>
      <h2>Preferences Table</h2>
      {/* Render preferences in a table here */}
    </div>
  );
};

export default PreferencesTable; 