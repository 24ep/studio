import type { CreateEvaluateLinkInitialData } from './create-evaluate-link-utils';

function getRecordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

export function getEvaluateLinkInterviewers(value: unknown): Array<{ id: string; name: string }> | undefined {
  if (!Array.isArray(value)) return undefined;

  const interviewers = value
    .map(getRecordValue)
    .map(interviewer => ({
      id: getStringValue(interviewer.id),
      name: getStringValue(interviewer.name),
    }))
    .filter((interviewer): interviewer is { id: string; name: string } => (
      Boolean(interviewer.id) && Boolean(interviewer.name)
    ));

  return interviewers.length > 0 ? interviewers : undefined;
}

export function getEvaluateLinkInitialData(customAttributes: unknown): CreateEvaluateLinkInitialData {
  const attributes = getRecordValue(customAttributes);
  return {
    interviewDateTime: getStringValue(attributes.interviewDateTime),
    interviewLocation: getStringValue(attributes.interviewLocation),
    interviewers: getEvaluateLinkInterviewers(attributes.interviewers),
  };
}
