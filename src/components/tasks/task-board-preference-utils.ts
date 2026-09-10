import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';

function setPreferenceChange<K extends keyof TaskBoardPreferences>(
  changes: Partial<TaskBoardPreferences>,
  key: K,
  value: TaskBoardPreferences[K]
) {
  changes[key] = value;
}

export function buildChangedTaskBoardPreferences(
  localPreferences: TaskBoardPreferences,
  savedPreferences: TaskBoardPreferences
): Partial<TaskBoardPreferences> {
  const changes: Partial<TaskBoardPreferences> = {};
  const keys = Object.keys(localPreferences) as Array<keyof TaskBoardPreferences>;

  keys.forEach((key) => {
    if (localPreferences[key] !== savedPreferences[key]) {
      setPreferenceChange(changes, key, localPreferences[key]);
    }
  });

  return changes;
}
