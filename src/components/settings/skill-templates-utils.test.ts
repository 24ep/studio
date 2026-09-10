import { describe, expect, it } from 'vitest';
import {
  buildEmptySkillTemplateFormData,
  getSelectedNames,
  selectAllUngroupedIds,
  toggleExpertiseGroupSelection,
  toggleIdSelection,
  togglePersonalityGroupSelection,
} from './skill-templates-utils';

describe('skill-templates-utils', () => {
  it('builds an empty template form state', () => {
    expect(buildEmptySkillTemplateFormData()).toEqual({
      name: '',
      description: '',
      groupIds: [],
      skillIds: [],
      personalityGroupIds: [],
      personalityTraitIds: [],
    });
  });

  it('selects and deselects expertise groups with their grouped skills', () => {
    const formData = buildEmptySkillTemplateFormData();
    const selected = toggleExpertiseGroupSelection(formData, 'group-1', [
      { id: 'skill-1', name: 'React', skillType: 'hard_skill', isActive: true, groupId: 'group-1' },
      { id: 'skill-2', name: 'Node', skillType: 'hard_skill', isActive: true, groupId: 'other' },
    ]);

    expect(selected.groupIds).toEqual(['group-1']);
    expect(selected.skillIds).toEqual(['skill-1']);
    expect(toggleExpertiseGroupSelection(selected, 'group-1', [
      { id: 'skill-1', name: 'React', skillType: 'hard_skill', isActive: true, groupId: 'group-1' },
    ])).toEqual(buildEmptySkillTemplateFormData());
  });

  it('selects and deselects personality groups with their grouped traits', () => {
    const selected = togglePersonalityGroupSelection(buildEmptySkillTemplateFormData(), 'group-1', [
      { id: 'trait-1', name: 'Calm', isActive: true, groupId: 'group-1' },
    ]);

    expect(selected.personalityGroupIds).toEqual(['group-1']);
    expect(selected.personalityTraitIds).toEqual(['trait-1']);
  });

  it('toggles ids and adds ungrouped ids without duplicates', () => {
    expect(toggleIdSelection(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleIdSelection(['a'], 'a')).toEqual([]);
    expect(selectAllUngroupedIds(['a'], [{ id: 'a' }, { id: 'b' }, { id: 'c', groupId: 'group' }])).toEqual(['a', 'b']);
  });

  it('maps selected ids to display names', () => {
    expect(getSelectedNames([{ id: '1', name: 'One' }, { id: '2', name: 'Two' }], ['2'])).toEqual(['Two']);
  });
});
