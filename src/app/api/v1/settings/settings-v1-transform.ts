import type {
  CustomFieldDefinitionRow,
  SettingsV1DataRows,
  SystemSettingRow,
  UserPreferenceRow,
} from './settings-v1-types';

export function buildV1SettingsResponse(rows: SettingsV1DataRows) {
  return {
    systemSettings: buildSystemSettings(rows.systemSettings),
    userPreferences: buildUserPreferences(rows.userPreferences),
    customFields: buildCustomFields(rows.customFields),
  };
}

function buildSystemSettings(rows: SystemSettingRow[]) {
  return rows.reduce<Record<string, Record<string, unknown>>>((settings, row) => {
    settings[row.category] ??= {};
    settings[row.category][row.key] = parseStoredJson(row.value, row.value);
    return settings;
  }, {});
}

function buildUserPreferences(rows: UserPreferenceRow[]) {
  return rows.reduce<Record<string, unknown>>((preferences, row) => {
    preferences[row.key] = parseStoredJson(row.value, row.value);
    return preferences;
  }, {});
}

function buildCustomFields(rows: CustomFieldDefinitionRow[]) {
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    isRequired: row.isRequired,
    options: row.options ? parseStoredJson<string[]>(row.options, []) : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function parseStoredJson<T = unknown>(value: string, fallback: T): T | unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
