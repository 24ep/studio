import { toast } from 'react-hot-toast';

import { getJsonString, readJsonObject, readJsonOrFallback } from '@/lib/response-json';

export type BaseResourceMethod = 'DELETE' | 'POST' | 'PUT';

interface FetchBaseCollectionInput {
  endpoint: string;
  errorMessage: string;
  logMessage: string;
  showToast?: boolean;
}

interface MutateBaseResourceInput {
  body?: unknown;
  fallbackMessage: string;
  logMessage: string;
  method: BaseResourceMethod;
  successMessage: string;
  url: string;
}

async function readErrorMessage(response: Response, fallback: string) {
  const error = await readJsonObject(response);
  return getJsonString(error, 'message') || getJsonString(error, 'error') || fallback;
}

async function readBaseCollection<T>(response: Response): Promise<T[]> {
  const data = await readJsonOrFallback<unknown>(response, []);
  return Array.isArray(data) ? data as T[] : [];
}

export async function fetchBaseCollection<T>({
  endpoint,
  errorMessage,
  logMessage,
  showToast = false,
}: FetchBaseCollectionInput) {
  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      return readBaseCollection<T>(response);
    }
  } catch (error) {
    console.error(logMessage, error);
    if (showToast) {
      toast.error(errorMessage);
    }
  }

  return [];
}

export async function mutateBaseResource({
  body,
  fallbackMessage,
  logMessage,
  method,
  successMessage,
  url,
}: MutateBaseResourceInput) {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(successMessage);
      return true;
    }

    toast.error(await readErrorMessage(response, fallbackMessage));
  } catch (error) {
    console.error(logMessage, error);
    toast.error(fallbackMessage);
  }

  return false;
}

export function createSortOrderUpdateRequest(endpoint: string, id: string, sortOrder: number) {
  return fetch(`${endpoint}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sortOrder }),
  });
}
