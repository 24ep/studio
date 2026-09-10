import { PositionCustomFieldDisplay } from './PositionCustomFieldDisplay';
import { PositionCustomFieldEdit } from './PositionCustomFieldEdit';
import type { CustomFieldValue, Position } from '@/lib/types';

interface PositionDetailsCustomFieldsProps {
  isEditMode: boolean;
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
  position: Position;
}

export function PositionDetailsCustomFields({
  isEditMode,
  onCustomFieldChange,
  position,
}: PositionDetailsCustomFieldsProps) {
  if (isEditMode) {
    return (
      <PositionCustomFieldEdit
        section="details"
        positionId={position?.id || ''}
        customFields={position?.customFields || {}}
        onFieldChange={onCustomFieldChange}
        title="Additional Position Information"
      />
    );
  }

  return (
    <PositionCustomFieldDisplay
      section="details"
      positionId={position?.id || ''}
      customFields={position?.customFields || {}}
      title="Additional Position Information"
    />
  );
}
