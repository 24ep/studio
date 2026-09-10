import {
  addApplicantSkill,
  mergeApplicantSkillsFromText,
  removeLastApplicantSkill,
} from './applicant-filter-query-utils';

export interface ApplicantSkillsInputKeyOptions {
  allowTabToAdd: boolean;
  allowBackspaceRemove: boolean;
  submitOnEnter: boolean;
}

export type ApplicantSkillsInputAction =
  | { type: 'none' }
  | { type: 'add'; skills: Set<string>; shouldApply: boolean }
  | { type: 'remove-last'; skills: Set<string> }
  | { type: 'submit' };

export function shouldAddSkillForKey(key: string, allowTabToAdd: boolean) {
  return key === 'Enter' || key === ',' || (allowTabToAdd && key === 'Tab');
}

export function getApplicantSkillsInputKeyAction({
  key,
  value,
  skills,
  options,
}: {
  key: string;
  value: string;
  skills: Set<string>;
  options: ApplicantSkillsInputKeyOptions;
}): ApplicantSkillsInputAction {
  const trimmedValue = value.trim();

  if (shouldAddSkillForKey(key, options.allowTabToAdd) && trimmedValue) {
    const result = addApplicantSkill(skills, trimmedValue);
    return result.changed
      ? { type: 'add', skills: result.skills, shouldApply: key === 'Enter' && options.submitOnEnter }
      : { type: 'none' };
  }

  if (key === 'Enter' && !trimmedValue && options.submitOnEnter) {
    return { type: 'submit' };
  }

  if (options.allowBackspaceRemove && key === 'Backspace' && !trimmedValue && skills.size > 0) {
    const result = removeLastApplicantSkill(skills);
    return result.changed
      ? { type: 'remove-last', skills: result.skills }
      : { type: 'none' };
  }

  return { type: 'none' };
}

export function getApplicantSkillsInputPasteAction({
  allowPasteMerge,
  paste,
  skills,
}: {
  allowPasteMerge: boolean;
  paste: string;
  skills: Set<string>;
}): ApplicantSkillsInputAction {
  if (!allowPasteMerge || !paste) {
    return { type: 'none' };
  }

  const result = mergeApplicantSkillsFromText(skills, paste);
  return result.changed
    ? { type: 'add', skills: result.skills, shouldApply: false }
    : { type: 'none' };
}
