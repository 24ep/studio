import { getFormStringValue } from './bulk-upload-cv-form-values';

function getFileFromField(formData: FormData, key: string | null): File | null {
  if (!key) {
    return null;
  }

  const value = formData.get(key);
  return value instanceof File && value.name ? value : null;
}

function parseAttachmentKeyList(rawValue: string | null): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function extractPrimaryFile(formData: FormData): { file: File | null; fieldName: string | null } {
  for (const candidate of ['file', 'files', 'primaryFile', 'primary_file']) {
    const file = getFileFromField(formData, candidate);
    if (file) {
      return { file, fieldName: candidate };
    }
  }

  const primaryFileKey = getFormStringValue(formData, 'primaryFileKey', 'primary_file_key');
  const keyedPrimaryFile = getFileFromField(formData, primaryFileKey);
  if (keyedPrimaryFile) {
    return { file: keyedPrimaryFile, fieldName: primaryFileKey };
  }

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.name && key !== 'additionalAttachments' && key !== 'additional_attachments') {
      return { file: value, fieldName: key };
    }
  }

  return { file: null, fieldName: null };
}

export function extractAdditionalAttachments(formData: FormData, primaryFieldName: string | null): File[] {
  const collected = new Map<string, File>();
  const addFile = (key: string, value: FormDataEntryValue | null, index = 0) => {
    if (value instanceof File && value.name && key !== primaryFieldName) {
      collected.set(`${key}:${index}`, value);
    }
  };

  formData.getAll('additionalAttachments').forEach((value, index) => addFile('additionalAttachments', value, index));
  formData.getAll('additional_attachments').forEach((value, index) => addFile('additional_attachments', value, index));

  const additionalKeys = [
    ...parseAttachmentKeyList(getFormStringValue(formData, 'additionalKeys', 'additional_keys')),
    ...parseAttachmentKeyList(getFormStringValue(formData, 'attachments', 'attachmentKeys', 'attachment_keys')),
  ];

  additionalKeys.forEach((key, index) => addFile(key, formData.get(key), index));

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('attachments[') || key.startsWith('additionalAttachment_')) {
      addFile(key, value);
    }
  }

  return Array.from(collected.values());
}
