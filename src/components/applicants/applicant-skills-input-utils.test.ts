import { describe, expect, it } from 'vitest';

import {
  getApplicantSkillsInputKeyAction,
  getApplicantSkillsInputPasteAction,
  shouldAddSkillForKey,
} from './applicant-skills-input-utils';

const defaultOptions = {
  allowTabToAdd: false,
  allowBackspaceRemove: true,
  submitOnEnter: true,
};

describe('applicant skills input utilities', () => {
  it('detects keys that add skills', () => {
    expect(shouldAddSkillForKey('Enter', false)).toBe(true);
    expect(shouldAddSkillForKey(',', false)).toBe(true);
    expect(shouldAddSkillForKey('Tab', false)).toBe(false);
    expect(shouldAddSkillForKey('Tab', true)).toBe(true);
  });

  it('maps keyboard events to skill actions', () => {
    const addAction = getApplicantSkillsInputKeyAction({
      key: 'Enter',
      value: ' React ',
      skills: new Set(['TypeScript']),
      options: defaultOptions,
    });

    expect(addAction.type).toBe('add');
    expect(addAction.type === 'add' ? Array.from(addAction.skills) : []).toEqual(['TypeScript', 'React']);
    expect(addAction.type === 'add' ? addAction.shouldApply : false).toBe(true);

    expect(getApplicantSkillsInputKeyAction({
      key: 'Enter',
      value: '',
      skills: new Set(['React']),
      options: defaultOptions,
    })).toEqual({ type: 'submit' });

    const removeAction = getApplicantSkillsInputKeyAction({
      key: 'Backspace',
      value: '',
      skills: new Set(['React', 'TypeScript']),
      options: defaultOptions,
    });
    expect(removeAction.type === 'remove-last' ? Array.from(removeAction.skills) : []).toEqual(['React']);
  });

  it('maps paste events to merge actions', () => {
    const pasteAction = getApplicantSkillsInputPasteAction({
      allowPasteMerge: true,
      paste: 'Python, React',
      skills: new Set(['React']),
    });

    expect(pasteAction.type).toBe('add');
    expect(pasteAction.type === 'add' ? Array.from(pasteAction.skills) : []).toEqual(['React', 'Python']);
    expect(getApplicantSkillsInputPasteAction({
      allowPasteMerge: false,
      paste: 'Python',
      skills: new Set(),
    })).toEqual({ type: 'none' });
  });
});
