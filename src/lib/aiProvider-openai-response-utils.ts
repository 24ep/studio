import {
  getArrayProperty,
  getRecordProperty,
  getStringProperty,
} from './aiProvider-object-utils';

export function shouldRetryOpenAiWithAlternateTokenField(data: unknown): boolean {
  const error = getRecordProperty(data, 'error');
  const errorParam = getStringProperty(error, 'param');
  const errorCode = getStringProperty(error, 'code');
  return errorCode === 'unsupported_parameter' &&
    (errorParam === 'max_completion_tokens' || errorParam === 'max_tokens');
}

export function getOpenAiGeneratedText(data: unknown) {
  const choice = getArrayProperty(data, 'choices')[0];
  const message = getRecordProperty(choice, 'message');
  return getOpenAiContentText(message?.content);
}

function getOpenAiContentText(content: unknown) {
  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map(getOpenAiTextPartValue)
    .filter(Boolean)
    .join('\n');
}

function getOpenAiTextPartValue(item: unknown) {
  const text = getRecordProperty(item, 'text');
  return getStringProperty(text, 'value') || getStringProperty(item, 'text') || '';
}
