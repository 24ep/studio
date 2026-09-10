import type { CustomFieldValue } from '@/lib/types';
import { CustomFieldDisplay } from '../CustomFieldDisplay';
import { CustomFieldEdit } from '../CustomFieldEdit';
import type { ContactTabProps } from './ContactTabTypes';

type ContactCustomFieldProps = Pick<
  ContactTabProps,
  'applicant' | 'onCustomFieldChange' | 'customFieldsRefreshTrigger'
>;

function noopCustomFieldChange(_fieldCode: string, _value: CustomFieldValue) {}

export function ContactCustomFieldEdit({
  applicant,
  onCustomFieldChange,
  customFieldsRefreshTrigger,
}: ContactCustomFieldProps) {
  return (
    <CustomFieldEdit
      modelName="Applicant"
      section="applicant-info"
      entityId={applicant.id}
      customFields={applicant.customFields || {}}
      onFieldChange={onCustomFieldChange || noopCustomFieldChange}
      title="Additional Information"
      refreshTrigger={customFieldsRefreshTrigger}
    />
  );
}

export function ContactCustomFieldDisplay({
  applicant,
  customFieldsRefreshTrigger,
}: ContactCustomFieldProps) {
  return (
    <CustomFieldDisplay
      modelName="Applicant"
      section="applicant-info"
      entityId={applicant.id}
      customFields={applicant.customFields || {}}
      title="Additional Information"
      refreshTrigger={customFieldsRefreshTrigger}
    />
  );
}
