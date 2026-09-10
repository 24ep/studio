import type { LocalizationTranslator } from '@/contexts/LocalizationContext';

/** Semantic, reusable UI labels. Add an entry here only when the same intent is
 * shared across features; feature-specific copy belongs in its own namespace. */
export const COMMON_LOCALIZATION_LABELS = {
  actions: 'Actions',
  all: 'All',
  back: 'Back',
  cancel: 'Cancel',
  clear: 'Clear',
  close: 'Close',
  confirm: 'Confirm',
  continue: 'Continue',
  delete: 'Delete',
  done: 'Done',
  edit: 'Edit',
  loading: 'Loading…',
  next: 'Next',
  no: 'No',
  notSet: 'Not set',
  previous: 'Previous',
  retry: 'Retry',
  save: 'Save',
  search: 'Search',
  submit: 'Submit',
  tryAgain: 'Try again',
  yes: 'Yes',
} as const;

export type CommonLocalizationLabel = keyof typeof COMMON_LOCALIZATION_LABELS;

export function createCommonLocalizationLabels(t: LocalizationTranslator) {
  return Object.fromEntries(
    Object.entries(COMMON_LOCALIZATION_LABELS).map(([name, fallback]) => [
      name,
      t(`common.${name}`, fallback),
    ]),
  ) as Record<CommonLocalizationLabel, string>;
}
