import {
  getApplicantParsedArrayValue,
  getApplicantParsedRecordField,
  isApplicantParsedRecord,
} from '../applicant-parsed-data-utils';
import type {
  ApplicantContactInfo,
  ApplicantSkillInfo,
  ContactSkillField,
} from './ContactTabTypes';

export function getContactSkillKey(field: ContactSkillField, index: number) {
  return field.field_id || field.id || `skill-${index}`;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function getApplicantContactInfo(parsedData: unknown): ApplicantContactInfo | undefined {
  const contactInfo = getApplicantParsedRecordField(parsedData, 'contact_info');
  return isApplicantParsedRecord(contactInfo) ? {
    ...contactInfo,
    email: getStringValue(contactInfo.email) || undefined,
    phone: getStringValue(contactInfo.phone) || undefined,
  } : undefined;
}

export function getApplicantSkills(parsedData: unknown): ApplicantSkillInfo[] {
  return getApplicantParsedArrayValue(parsedData, 'skills')
    .filter(isApplicantParsedRecord)
    .map(skill => ({
      ...skill,
      segment_skill: getStringValue(skill.segment_skill) || undefined,
      skill: Array.isArray(skill.skill) ? skill.skill.filter((item): item is string => typeof item === 'string') : undefined,
      skill_string: getStringValue(skill.skill_string) || undefined,
    }));
}

export function getSkillLabels(skill: ApplicantSkillInfo) {
  if (skill.skill && skill.skill.length > 0) {
    return skill.skill.map(item => item.trim()).filter(Boolean);
  }

  return (skill.skill_string || '').split(',').map(item => item.trim()).filter(Boolean);
}
