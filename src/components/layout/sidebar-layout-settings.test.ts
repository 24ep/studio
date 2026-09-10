import { describe, expect, it } from 'vitest';
import {
  buildSidebarLayoutSettings,
  getEffectiveSecondaryGroupLabels,
  SETTINGS_SIDEBAR_GROUP_LABEL,
} from './sidebar-layout-settings';

const groups = [
  { label: 'Analyst' },
  { label: 'Hiring' },
  { label: SETTINGS_SIDEBAR_GROUP_LABEL },
];

describe('sidebar layout settings', () => {
  it('uses settings as the default secondary sidebar group', () => {
    expect(buildSidebarLayoutSettings({})).toEqual({
      mode: 'single',
      secondaryGroupLabels: [SETTINGS_SIDEBAR_GROUP_LABEL],
    });
  });

  it('keeps settings secondary when other groups are configured', () => {
    expect(buildSidebarLayoutSettings({
      sidebarNavigationMode: 'split',
      sidebarSecondaryGroupLabels: JSON.stringify(['Hiring']),
    })).toEqual({
      mode: 'split',
      secondaryGroupLabels: [SETTINGS_SIDEBAR_GROUP_LABEL, 'Hiring'],
    });
  });

  it('enforces settings in the effective secondary sidebar groups', () => {
    expect(getEffectiveSecondaryGroupLabels(['Hiring'], groups)).toEqual([
      SETTINGS_SIDEBAR_GROUP_LABEL,
      'Hiring',
    ]);
  });
});
