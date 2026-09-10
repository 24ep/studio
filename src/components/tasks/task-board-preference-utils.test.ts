import { describe, expect, it } from 'vitest';

import { defaultTaskBoardPreferences } from '../../hooks/user-preferences-defaults';

import { buildChangedTaskBoardPreferences } from './task-board-preference-utils';
import {
  buildCardWidthPreferenceUpdate,
  getCurrentTaskBoardCardWidth,
  getEnabledTaskBoardCardFields,
  isTaskBoardCardWidth,
} from './card-customization-settings-utils';

describe('task board preference utilities', () => {
  it('returns only changed task board preferences', () => {
    expect(buildChangedTaskBoardPreferences({
      ...defaultTaskBoardPreferences,
      cardWidth: 'wide',
      showAssignee: true,
    }, defaultTaskBoardPreferences)).toEqual({
      cardWidth: 'wide',
      showAssignee: true,
    });
  });

  it('returns an empty diff when preferences have not changed', () => {
    expect(buildChangedTaskBoardPreferences(
      defaultTaskBoardPreferences,
      defaultTaskBoardPreferences
    )).toEqual({});
  });

  it('derives card customization width settings', () => {
    expect(isTaskBoardCardWidth('wide')).toBe(true);
    expect(isTaskBoardCardWidth('extra')).toBe(false);
    expect(buildCardWidthPreferenceUpdate('wide')).toEqual({
      cardWidth: 'wide',
      customCardWidth: 320,
    });
    expect(buildCardWidthPreferenceUpdate('custom')).toEqual({
      cardWidth: 'custom',
    });
    expect(getCurrentTaskBoardCardWidth({
      ...defaultTaskBoardPreferences,
      cardWidth: 'custom',
      customCardWidth: 280,
    })).toBe(280);
  });

  it('lists enabled task board card fields', () => {
    expect(getEnabledTaskBoardCardFields({
      ...defaultTaskBoardPreferences,
      showAvatar: true,
      showName: true,
      showEmail: false,
      showFitScore: false,
      showAssignee: false,
      showSkills: false,
      showJobApplied: false,
    }).map(field => field.key)).toEqual(['showAvatar', 'showName']);
  });
});
