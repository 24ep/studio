import { describe, expect, it } from 'vitest';

import { sidebarConfig, sidebarConfigData } from './SidebarNavConfig';
import { buildFigmaSidebarSections } from './SidebarSinglePanel';

describe('performance navigation', () => {
  it('uses one Performance destination instead of a separate Appraisal route', () => {
    const workforce = sidebarConfigData.find(group => group.id === 'workforce');
    const performance = sidebarConfigData.find(group => group.id === 'performance');

    expect(workforce?.items.map(item => item.href)).not.toContain('/workforce/appraisal');
    expect(performance).toMatchObject({
      label: 'Performance',
      items: [expect.objectContaining({ label: 'Performance', href: '/workforce/performance' })],
    });
  });

  it('renders the consolidated Performance destination inside People', () => {
    const people = buildFigmaSidebarSections(sidebarConfig)
      .flatMap(section => section.entries)
      .find(entry => entry.type === 'group' && entry.label === 'Employee');

    expect(people).toMatchObject({
      type: 'group',
      children: expect.arrayContaining([
        expect.objectContaining({ label: 'Performance' }),
      ]),
    });
    if (people?.type === 'group') expect(people.children.map(child => child.label)).not.toContain('Appraisal');
  });
});
