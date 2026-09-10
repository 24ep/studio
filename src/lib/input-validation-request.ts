import { NextRequest } from "next/server";
import { z } from "zod";
import { readRequestJsonResult } from "./request-json";

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => `${err.path.join(".")}: ${err.message}`),
      };
    }
    return {
      success: false,
      errors: ["Invalid input format"],
    };
  }
}

async function validateJsonRequestContent(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    return {
      errors: ["Content-Type must be application/json"],
      status: 400,
    };
  }

  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const { securityConfig } = await import("@/lib/securityConfig");
  const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024;
  const size = parseInt(contentLength, 10);

  if (size > maxSize) {
    return {
      errors: [`Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB`],
      status: 413,
    };
  }

  return null;
}

export async function validateApiRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; errors: string[]; status: number }> {
  try {
    const contentError = await validateJsonRequestContent(request);
    if (contentError) {
      return {
        success: false,
        ...contentError,
      };
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return {
        success: false,
        errors: ["Invalid JSON in request body"],
        status: 400,
      };
    }

    const body = bodyResult.value;
    const validation = validateRequest(schema, body);

    if (validation.success) {
      return { success: true, data: validation.data };
    }

    return {
      success: false,
      errors: validation.errors,
      status: 400,
    };
  } catch {
    return {
      success: false,
      errors: ["Invalid JSON in request body"],
      status: 400,
    };
  }
}
