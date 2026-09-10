import { ContactEditView, ContactReadView } from './ContactTabParts';
import type { ContactTabProps } from './ContactTabTypes';
import { getApplicantContactInfo, getApplicantSkills } from './contact-tab-utils';

export function ContactTab({
  applicant,
  isEditing,
  register,
  skillsFields = [],
  appendSkill,
  removeSkill,
  onCustomFieldChange,
  customFieldsRefreshTrigger,
}: ContactTabProps) {
  const contactInfo = getApplicantContactInfo(applicant.parsedData);
  const skills = getApplicantSkills(applicant.parsedData);

  if (isEditing) {
    return (
      <ContactEditView
        applicant={applicant}
        register={register}
        skillsFields={skillsFields}
        appendSkill={appendSkill}
        removeSkill={removeSkill}
        onCustomFieldChange={onCustomFieldChange}
        customFieldsRefreshTrigger={customFieldsRefreshTrigger}
      />
    );
  }

  return (
    <ContactReadView
      applicant={applicant}
      contactInfo={contactInfo}
      skills={skills}
      customFieldsRefreshTrigger={customFieldsRefreshTrigger}
    />
  );
}
