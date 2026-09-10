import type {
  ApplicantContactInfo,
  ApplicantSkillInfo,
  ContactTabProps,
} from './ContactTabTypes';
import {
  ContactCustomFieldDisplay,
  ContactCustomFieldEdit,
  ContactEditableSkillsCard,
  ContactInfoCard,
  ContactReadSkillsCard,
} from './ContactTabCards';

type ContactCustomFieldProps = Pick<
  ContactTabProps,
  'applicant' | 'onCustomFieldChange' | 'customFieldsRefreshTrigger'
>;

interface ContactEditViewProps extends ContactCustomFieldProps {
  register: ContactTabProps['register'];
  skillsFields: NonNullable<ContactTabProps['skillsFields']>;
  appendSkill?: ContactTabProps['appendSkill'];
  removeSkill?: ContactTabProps['removeSkill'];
}

interface ContactReadViewProps extends ContactCustomFieldProps {
  contactInfo?: ApplicantContactInfo;
  skills: ApplicantSkillInfo[];
}

export function ContactEditView({
  applicant,
  register,
  skillsFields,
  appendSkill,
  removeSkill,
  onCustomFieldChange,
  customFieldsRefreshTrigger,
}: ContactEditViewProps) {
  return (
    <div className="space-y-4">
      <ContactEditableSkillsCard
        register={register}
        skillsFields={skillsFields}
        appendSkill={appendSkill}
        removeSkill={removeSkill}
      />

      <ContactCustomFieldEdit
        applicant={applicant}
        onCustomFieldChange={onCustomFieldChange}
        customFieldsRefreshTrigger={customFieldsRefreshTrigger}
      />
    </div>
  );
}

export function ContactReadView({
  applicant,
  contactInfo,
  skills,
  customFieldsRefreshTrigger,
}: ContactReadViewProps) {
  return (
    <div className="space-y-4">
      <ContactInfoCard contactInfo={contactInfo} />
      <ContactReadSkillsCard skills={skills} />

      <ContactCustomFieldDisplay
        applicant={applicant}
        customFieldsRefreshTrigger={customFieldsRefreshTrigger}
      />
    </div>
  );
}
