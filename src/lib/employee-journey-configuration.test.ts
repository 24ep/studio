import { describe, expect, it } from 'vitest';

import {
  buildOffboardingChecklist,
  defaultEmployeeJourneyConfiguration,
  getJourneyConfigurationGaps,
  parseEmployeeJourneyConfiguration,
} from './employee-journey-configuration';

describe('employee journey configuration', () => {
  it('falls back to complete defaults when no saved value exists', () => {
    expect(parseEmployeeJourneyConfiguration(undefined).templates).toHaveLength(3);
    expect(getJourneyConfigurationGaps(defaultEmployeeJourneyConfiguration)).toEqual([]);
  });

  it('detects actionable configuration gaps', () => {
    const configuration = parseEmployeeJourneyConfiguration(JSON.stringify({ version: 1, templates: [{ id: 'x', name: 'Incomplete', description: '', journeyType: 'probation', isActive: true, stages: [] }] }));
    expect(getJourneyConfigurationGaps(configuration).map(gap => gap.severity)).toContain('critical');
  });

  it('builds new offboarding checklists from the active template', () => {
    const checklist = buildOffboardingChecklist(defaultEmployeeJourneyConfiguration, '2026-08-31');
    expect(checklist).toHaveLength(5);
    expect(checklist.find(task => task.id === 'knowledge-transfer')).toMatchObject({ dueDate: '2026-08-28', owner: 'Line manager' });
  });
});
