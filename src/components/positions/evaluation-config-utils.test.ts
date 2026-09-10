import { describe, expect, it } from 'vitest';

import {
  buildEvaluationTemplatePreviewSections,
  buildEvaluationTemplateApplyTasks,
  filterAssignedEvaluationItems,
  filterUnassignedEvaluationItems,
  getEvaluationTemplateIds,
  getSelectableItemsInGroup,
  isEvaluationTemplateFullyApplied,
  runEvaluationTemplateApplyTasks,
  summarizeEvaluationTemplateApplyResults,
  toggleSelectedItemsForGroup,
} from './evaluation-config-utils';

describe('evaluation config utilities', () => {
  it('extracts all template assignment ids', () => {
    expect(getEvaluationTemplateIds({
      templateGroups: [{ group: { id: 'group-1' } }],
      templateSkills: [{ skill: { id: 'skill-1' } }],
      templatePersonalityGroups: [{ group: { id: 'personality-group-1' } }],
      templatePersonalityTraits: [{ trait: { id: 'trait-1' } }],
    })).toEqual({
      groupIds: ['group-1'],
      skillIds: ['skill-1'],
      personalityGroupIds: ['personality-group-1'],
      traitIds: ['trait-1'],
    });
  });

  it('detects when every template skill and trait is already assigned', () => {
    const template = {
      templateSkills: [{ skill: { id: 'skill-1' } }, { skill: { id: 'skill-2' } }],
      templatePersonalityTraits: [{ trait: { id: 'trait-1' } }],
    };

    expect(isEvaluationTemplateFullyApplied(
      template,
      [{ skillId: 'skill-1' }, { skillId: 'skill-2' }],
      [{ traitId: 'trait-1' }]
    )).toBe(true);

    expect(isEvaluationTemplateFullyApplied(
      template,
      [{ skillId: 'skill-1' }],
      [{ traitId: 'trait-1' }]
    )).toBe(false);
  });

  it('filters selectable group items by assignment, group, and search', () => {
    const items = [
      { id: '1', name: 'React', groupId: 'frontend' },
      { id: '2', name: 'Vue', groupId: 'frontend', description: 'Framework' },
      { id: '3', name: 'SQL', groupId: 'data' },
      { id: '4', name: 'No Group' },
    ];

    expect(getSelectableItemsInGroup(items, new Set(['1']), 'frontend', 'framework').map(item => item.id)).toEqual(['2']);
    expect(getSelectableItemsInGroup(items, new Set(), 'ungrouped', '').map(item => item.id)).toEqual(['4']);
  });

  it('filters unassigned items by assigned ids and search text', () => {
    const items = [
      { id: '1', name: 'React' },
      { id: '2', name: 'Vue', description: 'Frontend framework' },
      { id: '3', name: 'SQL' },
    ];

    expect(filterUnassignedEvaluationItems(items, ['1'], 'framework').map(item => item.id)).toEqual(['2']);
    expect(filterUnassignedEvaluationItems(items, [], '').map(item => item.id)).toEqual(['1', '2', '3']);
  });

  it('filters assigned wrappers through their nested item', () => {
    const assigned = [
      { id: 'assignment-1', skill: { id: '1', name: 'React' } },
      { id: 'assignment-2', skill: { id: '2', name: 'Vue', description: 'Framework' } },
    ];

    expect(filterAssignedEvaluationItems(assigned, assignment => assignment.skill, 'framework').map(item => item.id)).toEqual(['assignment-2']);
  });

  it('toggles all visible group items', () => {
    const groupItems = [
      { id: '1', name: 'React' },
      { id: '2', name: 'Vue' },
    ];

    expect(toggleSelectedItemsForGroup([], groupItems)).toEqual(groupItems);
    expect(toggleSelectedItemsForGroup(groupItems, groupItems)).toEqual([]);
    expect(toggleSelectedItemsForGroup([{ id: '1', name: 'React' }], groupItems)).toEqual(groupItems);
  });

  it('builds template preview sections with grouped and ungrouped items', () => {
    const sections = buildEvaluationTemplatePreviewSections([
      { id: 'frontend', name: 'Frontend', color: '#00f' },
      { id: 'backend', name: 'Backend', color: '#0f0' },
    ], [
      { id: 'assignment-1', item: { id: 'react', name: 'React', groupId: 'frontend' } },
      { id: 'assignment-2', item: { id: 'sql', name: 'SQL', groupId: 'missing-group' } },
      { id: 'assignment-3', item: { id: 'writing', name: 'Writing' } },
      { id: 'assignment-4' },
    ], 'Other Skills');

    expect(sections).toEqual([
      {
        id: 'frontend',
        name: 'Frontend',
        color: '#00f',
        items: [
          { id: 'assignment-1', item: { id: 'react', name: 'React', groupId: 'frontend' } },
        ],
      },
      {
        id: 'ungrouped',
        name: 'Other Skills',
        items: [
          { id: 'assignment-2', item: { id: 'sql', name: 'SQL', groupId: 'missing-group' } },
          { id: 'assignment-3', item: { id: 'writing', name: 'Writing' } },
        ],
        isUngrouped: true,
      },
    ]);
  });

  it('builds template apply tasks and skips already assigned direct items', () => {
    const tasks = buildEvaluationTemplateApplyTasks({
      template: {
        templateGroups: [{ group: { id: 'group-1' } }],
        templateSkills: [{ skill: { id: 'skill-1' } }, { skill: { id: 'skill-2' } }],
        templatePersonalityGroups: [{ group: { id: 'personality-group-1' } }],
        templatePersonalityTraits: [{ trait: { id: 'trait-1' } }, { trait: { id: 'trait-2' } }],
      },
      positionSkills: [{ skillId: 'skill-1' }],
      positionTraits: [{ traitId: 'trait-1' }],
      expertiseGroups: [{ id: 'group-1', name: 'Frontend' }],
      expertiseSkills: [{ id: 'skill-2', name: 'React' }],
      personalityGroups: [{ id: 'personality-group-1', name: 'Leadership' }],
      personalityTraits: [{ id: 'trait-2', name: 'Ownership' }],
    });

    expect(tasks).toEqual([
      {
        kind: 'expertise-group',
        id: 'group-1',
        name: 'Frontend',
        payload: { groupId: 'group-1', isRequired: false, weight: 1.0 },
        duplicateOkStatus: 400,
      },
      {
        kind: 'expertise-skill',
        id: 'skill-2',
        name: 'React',
        payload: { skillId: 'skill-2' },
        duplicateOkStatus: 409,
      },
      {
        kind: 'personality-group',
        id: 'personality-group-1',
        name: 'Leadership',
        payload: { groupId: 'personality-group-1', isRequired: false, weight: 1.0 },
        duplicateOkStatus: 400,
      },
      {
        kind: 'personality-trait',
        id: 'trait-2',
        name: 'Ownership',
        payload: { traitId: 'trait-2' },
        duplicateOkStatus: 409,
      },
    ]);
  });

  it('runs template apply tasks through an executor', async () => {
    const tasks = buildEvaluationTemplateApplyTasks({
      template: {
        templateSkills: [{ skill: { id: 'skill-1' } }, { skill: { id: 'skill-2' } }],
      },
      positionSkills: [],
      positionTraits: [],
      expertiseGroups: [],
      expertiseSkills: [{ id: 'skill-1', name: 'React' }, { id: 'skill-2', name: 'SQL' }],
      personalityGroups: [],
      personalityTraits: [],
    });

    const results = await runEvaluationTemplateApplyTasks(tasks, async task => ({
      ok: task.id !== 'skill-2',
      status: task.id === 'skill-1' ? 201 : 500,
      id: task.id,
      name: task.name,
    }), 1);

    expect(results).toEqual([
      { ok: true, status: 201, id: 'skill-1', name: 'React' },
      { ok: false, status: 500, id: 'skill-2', name: 'SQL' },
    ]);
  });

  it('summarizes template apply results for toasts', () => {
    expect(summarizeEvaluationTemplateApplyResults([
      { ok: true, status: 201, id: 'skill-1', name: 'React' },
      { ok: true, status: 409, id: 'skill-2', name: 'SQL' },
    ])).toEqual({
      failedNames: [],
      addedCount: 1,
      failureMessage: null,
      successMessage: 'Template applied successfully (1 items added)',
    });

    expect(summarizeEvaluationTemplateApplyResults([
      { ok: false, status: 500, id: 'a', name: 'A' },
      { ok: false, status: 500, id: 'b', name: 'B' },
      { ok: false, status: 500, id: 'c', name: 'C' },
      { ok: false, status: 500, id: 'd', name: 'D' },
      { ok: false, status: 500, id: 'e', name: 'E' },
      { ok: false, status: 500, id: 'f', name: 'F' },
    ]).failureMessage).toBe('Some items failed to add: A, B, C, D, E...');
  });
});
