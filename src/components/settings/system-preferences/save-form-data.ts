import { appendSystemPreferenceFiles } from './save-form-data-files';
import type {
  SystemPreferenceEntry,
  SystemPreferencesSaveInput,
} from './save-form-data-types';
import { buildSystemPreferenceEntries } from './save-preference-entries';

export function buildSystemPreferencesFormData(input: SystemPreferencesSaveInput) {
  const formData = new FormData();
  const preferencesToSave = buildSystemPreferenceEntries(input);

  appendSystemPreferenceFiles(formData, input);

  if (preferencesToSave.length > 0) {
    formData.append('preferences', JSON.stringify(preferencesToSave));
  }

  return {
    formData,
    preferencesToSave,
  };
}

export type { SystemPreferenceEntry, SystemPreferencesSaveInput };
