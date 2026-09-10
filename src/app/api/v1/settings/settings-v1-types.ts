export type SystemSettingRow = {
  key: string;
  value: string;
  category: string;
};

export type UserPreferenceRow = {
  key: string;
  value: string;
};

export type CustomFieldDefinitionRow = {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  options: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type SettingsV1DataRows = {
  systemSettings: SystemSettingRow[];
  userPreferences: UserPreferenceRow[];
  customFields: CustomFieldDefinitionRow[];
};
