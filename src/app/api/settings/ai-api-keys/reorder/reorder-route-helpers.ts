import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { z, ZodError } from "zod";

import { logAudit } from "@/lib/auditLog";
import { getApiKeys, saveApiKeys } from "@/lib/aiApiKeyManager";
import type { AiProvider } from "@/lib/aiProvider";

export const reorderApiKeysSchema = z.object({
  apiKeys: z.array(z.object({
    key: z.string(),
    priority: z.number().positive(),
    selectedModel: z.string().optional(),
  })),
  provider: z.enum(["gemini", "openai", "deepseek"]).optional(),
});

export type ReorderApiKeysInput = z.infer<typeof reorderApiKeysSchema>;

type ReorderApiKeysError = Error & {
  code?: string;
};

export function toReorderApiKeysError(error: unknown): ReorderApiKeysError {
  return error instanceof Error ? error as ReorderApiKeysError : new Error(String(error)) as ReorderApiKeysError;
}

function getReorderProvider(input: ReorderApiKeysInput): AiProvider {
  if (input.provider === "openai" || input.provider === "deepseek") {
    return input.provider;
  }

  return "gemini";
}

function getDuplicatePriorityResponse(input: ReorderApiKeysInput) {
  const priorities = input.apiKeys.map(key => key.priority);
  const uniquePriorities = new Set(priorities);

  if (priorities.length === uniquePriorities.size) {
    return null;
  }

  return NextResponse.json(
    { error: "Invalid request: Duplicate priorities found" },
    { status: 400 },
  );
}

export function parseReorderApiKeysBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return {
      response: NextResponse.json(
        { error: "Invalid request: Request body is required" },
        { status: 400 },
      ),
    };
  }

  const validation = reorderApiKeysSchema.safeParse(body);
  if (!validation.success) {
    console.error("Schema validation error:", validation.error);
    return {
      response: NextResponse.json(
        {
          error: "Invalid request format",
          message: "Request body does not match expected schema",
          details: validation.error.issues,
        },
        { status: 400 },
      ),
    };
  }

  if (validation.data.apiKeys.length === 0) {
    return {
      response: NextResponse.json({ message: "No API keys provided" }, { status: 400 }),
    };
  }

  const duplicatePriorityResponse = getDuplicatePriorityResponse(validation.data);
  if (duplicatePriorityResponse) {
    return { response: duplicatePriorityResponse };
  }

  return { input: validation.data };
}

export async function validateAndSaveReorderedApiKeys(input: ReorderApiKeysInput) {
  const provider = getReorderProvider(input);
  const currentApiKeys = await getApiKeys(provider);

  if (!Array.isArray(currentApiKeys)) {
    console.error("getApiKeys returned non-array:", currentApiKeys);
    return {
      response: NextResponse.json(
        { error: "Server error: Failed to retrieve current API keys" },
        { status: 500 },
      ),
    };
  }

  const currentKeySet = new Set(currentApiKeys.map(key => key.key));
  const missingApiKey = input.apiKeys.find(apiKey => !currentKeySet.has(apiKey.key));

  if (missingApiKey) {
    return {
      response: NextResponse.json(
        { error: `API key not found: ${missingApiKey.key.substring(0, 8)}...` },
        { status: 400 },
      ),
    };
  }

  await saveApiKeys(input.apiKeys, provider);
  return { provider };
}

export async function logSuccessfulApiKeyReorder(
  user: NonNullable<Session["user"]>,
  provider: AiProvider,
  input: ReorderApiKeysInput,
) {
  await logAudit(
    "INFO",
    `${provider} AI API keys reordered by ${user.name}. Total keys: ${input.apiKeys.length}`,
    "API:AiApiKeys:Reorder",
    user.id,
    {
      provider,
      keyCount: input.apiKeys.length,
      priorities: input.apiKeys.map(key => key.priority),
    },
  );
}

export async function logFailedApiKeyReorder(
  user: Session["user"] | undefined,
  apiKeyError: Error,
) {
  await logAudit(
    "ERROR",
    `Failed to reorder AI API keys by ${user?.name || user?.email || "Unknown"}. Error: ${apiKeyError.message}`,
    "API:AiApiKeys:Reorder",
    user?.id,
    {
      error: apiKeyError.message,
      stack: apiKeyError.stack,
    },
  );
}

export function getKnownReorderApiKeysErrorResponse(error: unknown, apiKeyError: ReorderApiKeysError) {
  if (error instanceof ZodError) {
    console.error("Validation error details:", error.issues);
    return NextResponse.json({
      message: "Validation error",
      error: "Invalid request format",
      details: error.issues,
    }, { status: 400 });
  }

  if (apiKeyError.code === "ECONNREFUSED" || apiKeyError.code === "ENOTFOUND") {
    console.error("Database connection error:", error);
    return NextResponse.json({
      message: "Database connection error",
      error: "Unable to connect to database",
    }, { status: 500 });
  }

  if (apiKeyError.code === "23505") {
    return NextResponse.json({
      message: "Database constraint error",
      error: "Duplicate data detected",
    }, { status: 400 });
  }

  return null;
}
