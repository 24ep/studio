import { readCategoryTreeErrorMessage } from "./categories-tree-tab-api";

export type CategoryTreeMutationMethod = "POST" | "PUT" | "DELETE";

export type CategoryTreeMutationResult =
  | { ok: true }
  | { message: string; ok: false };

export interface RunCategoryTreeMutationOptions {
  body?: unknown;
  fallbackMessage: string;
  method: CategoryTreeMutationMethod;
  url: string;
}

export async function runCategoryTreeMutation({
  body,
  fallbackMessage,
  method,
  url,
}: RunCategoryTreeMutationOptions): Promise<CategoryTreeMutationResult> {
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
  });

  if (response.ok) {
    return { ok: true };
  }

  return {
    message: await readCategoryTreeErrorMessage(response, fallbackMessage),
    ok: false,
  };
}
