import type React from 'react';
import type { Applicant, HeadcountType } from '@/lib/types';
import { HeadcountCustomFields } from './HeadcountCustomFields';
import type { HeadcountModalSaveData } from './HeadcountModalTypes';
import {
  HeadcountApplicantAssignment,
  HeadcountDateFields,
  HeadcountIdentifierFields,
  HeadcountModalActions,
  HeadcountNotesField,
  HeadcountTypeStatusFields,
} from './HeadcountModalFormParts';

interface HeadcountModalFormProps {
  formData: HeadcountModalSaveData;
  headcountTypeOptions: Array<{ value: HeadcountType; label: string }>;
  isEdit: boolean;
  loading: boolean;
  positionId: string;
  selectedApplicant: Applicant | null;
  setFormData: React.Dispatch<React.SetStateAction<HeadcountModalSaveData>>;
  onCancel: () => void;
}

export function HeadcountModalForm({
  formData,
  headcountTypeOptions,
  isEdit,
  loading,
  positionId,
  selectedApplicant,
  setFormData,
  onCancel,
}: HeadcountModalFormProps) {
  return (
    <>
      <HeadcountTypeStatusFields
        formData={formData}
        headcountTypeOptions={headcountTypeOptions}
        setFormData={setFormData}
      />
      <HeadcountDateFields formData={formData} loading={loading} setFormData={setFormData} />
      {isEdit && <HeadcountApplicantAssignment selectedApplicant={selectedApplicant} />}
      <HeadcountNotesField formData={formData} setFormData={setFormData} />
      <HeadcountIdentifierFields formData={formData} loading={loading} setFormData={setFormData} />
      <HeadcountCustomFields
        customFields={formData.customFields}
        onCustomFieldsChange={(customFields) => setFormData(prev => ({ ...prev, customFields }))}
        positionId={positionId}
      />
      <HeadcountModalActions isEdit={isEdit} loading={loading} onCancel={onCancel} />
    </>
  );
}
