import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';
import { cardFieldConfigs, cardWidthOptions, type TaskBoardCardWidth } from './CardCustomizationSettingsConfig';

export function isTaskBoardCardWidth(value: string): value is TaskBoardCardWidth {
  return cardWidthOptions.some(option => option.value === value);
}

export function buildCardWidthPreferenceUpdate(value: TaskBoardCardWidth): Partial<TaskBoardPreferences> {
  const widthOption = cardWidthOptions.find(option => option.value === value);
  return {
    cardWidth: value,
    ...(widthOption?.width ? { customCardWidth: widthOption.width } : {}),
  };
}

export function getCurrentTaskBoardCardWidth(preferences: TaskBoardPreferences) {
  if (preferences.cardWidth === 'custom') {
    return preferences.customCardWidth || 256;
  }

  const option = cardWidthOptions.find(candidate => candidate.value === preferences.cardWidth);
  return option?.width || 256;
}

export function getEnabledTaskBoardCardFields(preferences: TaskBoardPreferences) {
  return cardFieldConfigs.filter(field => preferences[field.key] === true);
}
