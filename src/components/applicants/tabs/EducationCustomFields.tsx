import type { Applicant, CustomFieldValue } from '@/lib/types';
import { CustomFieldDisplay } from '../CustomFieldDisplay';
import { CustomFieldEdit } from '../CustomFieldEdit';

interface EducationCustomFieldsProps {
  applicant: Applicant;
  isEditing: boolean;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
}

export function EducationCustomFields({
  applicant,
  isEditing,
  onCustomFieldChange,
}: EducationCustomFieldsProps) {
  if (isEditing) {
    return (
      <CustomFieldEdit
        modelName="Applicant"
        section="education"
        entityId={applicant.id}
        customFields={applicant.customFields || {}}
        onFieldChange={onCustomFieldChange || (() => { })}
        title="Additional Education Information"
      />
    );
  }

  return (
    <CustomFieldDisplay
      modelName="Applicant"
      section="education"
      entityId={applicant.id}
      customFields={applicant.customFields || {}}
      title="Additional Education Information"
    />
  );
}
