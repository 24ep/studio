import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';

export interface TreeNodeMutationRequest {
  body?: unknown;
  fallbackMessage: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
}

export interface TreeNodeMutationSuccess {
  ok: true;
}

export interface TreeNodeMutationFailure {
  ok: false;
  errorData: unknown;
  message: string;
}

export type TreeNodeMutationResult = TreeNodeMutationSuccess | TreeNodeMutationFailure;

export async function runTreeNodeJsonMutation({
  body,
  fallbackMessage,
  method,
  url,
}: TreeNodeMutationRequest): Promise<TreeNodeMutationResult> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const errorData = await readJsonOrFallback<{ message?: string; error?: string }>(response, { error: fallbackMessage });
  return {
    ok: false,
    errorData,
    message: errorData.message || errorData.error || fallbackMessage,
  };
}

export async function runTreeNodeSimpleMutation({
  body,
  fallbackMessage,
  method,
  url,
}: TreeNodeMutationRequest): Promise<TreeNodeMutationResult> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.ok) {
    return { ok: true };
  }

  const errorData = await readJsonObject(response);
  return {
    ok: false,
    errorData,
    message: getJsonErrorMessage(errorData, fallbackMessage),
  };
}
