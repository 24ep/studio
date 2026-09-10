import type { Applicant, CustomFieldValue } from '@/lib/types';
import { CustomFieldDisplay } from '../CustomFieldDisplay';
import { CustomFieldEdit } from '../CustomFieldEdit';

interface ExperienceTabCustomFieldsProps {
  applicant: Applicant;
  isEditing: boolean;
  onCustomFieldChange?: (fieldCode: string, value: CustomFieldValue) => void;
}

export function ExperienceTabCustomFields({
  applicant,
  isEditing,
  onCustomFieldChange,
}: ExperienceTabCustomFieldsProps) {
  if (isEditing) {
    return (
      <CustomFieldEdit
        modelName="Applicant"
        section="experience"
        entityId={applicant.id}
        customFields={applicant.customFields || {}}
        onFieldChange={onCustomFieldChange || (() => {})}
        title="Additional Experience Information"
      />
    );
  }

  return (
    <CustomFieldDisplay
      modelName="Applicant"
      section="experience"
      entityId={applicant.id}
      customFields={applicant.customFields || {}}
      title="Additional Experience Information"
    />
  );
}
