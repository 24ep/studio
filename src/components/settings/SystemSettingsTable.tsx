import React, { useCallback } from 'react';
import type { SystemSetting } from "@/lib/types";

import {
  SystemSettingsCategoryCard,
  SystemSettingsStateCard,
} from './SystemSettingsTableParts';
import {
  filterAllowedSystemSettings,
  groupSystemSettingsByCategory,
} from './system-settings-table-utils';

interface SystemSettingsTableProps {
  settings: SystemSetting[];
  isLoading: boolean;
  onEdit: (setting: SystemSetting) => void;
}

const SystemSettingsTable: React.FC<SystemSettingsTableProps> = ({ settings, isLoading, onEdit }) => {
  const handleEdit = useCallback((setting: SystemSetting) => {
    onEdit(setting);
  }, [onEdit]);

  if (isLoading) {
    return <SystemSettingsStateCard message="Loading settings..." />;
  }

  const filteredSettings = filterAllowedSystemSettings(settings);

  if (!filteredSettings || filteredSettings.length === 0) {
    return <SystemSettingsStateCard message="No settings found" />;
  }

  const groupedSettings = groupSystemSettingsByCategory(filteredSettings);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <SystemSettingsCategoryCard
          key={category}
          category={category}
          settings={categorySettings}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
};

export default SystemSettingsTable; 
