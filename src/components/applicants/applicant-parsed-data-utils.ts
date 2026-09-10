export type ApplicantParsedRecord = Record<string, unknown>;

export function isApplicantParsedRecord(value: unknown): value is ApplicantParsedRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseApplicantParsedDataRecord(parsedData: unknown): ApplicantParsedRecord {
  if (typeof parsedData === 'string') {
    try {
      const parsed = JSON.parse(parsedData) as unknown;
      return isApplicantParsedRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isApplicantParsedRecord(parsedData) ? parsedData : {};
}

export function getApplicantParsedRecordField(parsedData: unknown, fieldName: string) {
  const value = parseApplicantParsedDataRecord(parsedData)[fieldName];
  return isApplicantParsedRecord(value) ? value : {};
}

export function getApplicantParsedArrayField(parsedData: unknown, fieldName: string) {
  const value = parseApplicantParsedDataRecord(parsedData)[fieldName];
  return Array.isArray(value) ? value : [];
}

export function getApplicantParsedValue(parsedData: unknown, fieldName: string) {
  const parsedRecord = parseApplicantParsedDataRecord(parsedData);
  const applicantInfo = parsedRecord.applicant_info;

  if (isApplicantParsedRecord(applicantInfo) && fieldName in applicantInfo) {
    return applicantInfo[fieldName];
  }

  return parsedRecord[fieldName];
}

export function getApplicantParsedArrayValue(parsedData: unknown, fieldName: string) {
  const value = getApplicantParsedValue(parsedData, fieldName);
  return Array.isArray(value) ? value : [];
}
