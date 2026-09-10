import { getNetworkErrorStatus, getNetworkErrorText } from './network-error-extractors';

const SERVICE_UNAVAILABLE_MESSAGE = /\b(?:service(?: is)?|server(?: is)?) (?:temporarily )?unavailable\b/i;
const HTTP_503_MESSAGE = /(?:\bhttp(?: error)?|\bstatus(?: code)?)\D{0,12}503\b|\b503\s+service unavailable\b/i;

export function isServiceUnavailableError(error: unknown): boolean {
  if (getNetworkErrorStatus(error) === 503) return true;

  const message = getNetworkErrorText(error);
  return SERVICE_UNAVAILABLE_MESSAGE.test(message) || HTTP_503_MESSAGE.test(message);
}

export function isPageLoadRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  const requestMethod = init?.method ?? (input instanceof Request ? input.method : 'GET');
  const method = requestMethod.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return false;

  const requestUrl = input instanceof Request ? input.url : String(input);

  try {
    const pathname = new URL(requestUrl, 'http://localhost').pathname;
    return pathname !== '/api' && !pathname.startsWith('/api/');
  } catch {
    return true;
  }
}
