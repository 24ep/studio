import type { NextRequest } from 'next/server';
import type { updateApiKey } from '@/lib/systemApiKeyManager';

import {
  createValidationError,
  SimpleErrorHandler,
} from '@/lib/errors';
import { readRequestJsonObject } from '@/lib/request-json';

type SystemApiKeyUpdates = Parameters<typeof updateApiKey>[1];

type ParsedRequest<T> =
  | { ok: true; input: T }
  | { ok: false; response: Response };

export async function parseCreateSystemApiKeyRequest(req: NextRequest): Promise<ParsedRequest<{
  description?: string;
  expiresAt: Date | null;
  name: string;
}>> {
  const body = await readRequestJsonObject(req);
  const name = readOptionalString(body.name);
  const description = readOptionalString(body.description);
  const expiresAtInput = readOptionalString(body.expiresAt);

  const validatedName = validateApiKeyName(req, name, 'Name is required');
  if (!validatedName.ok) {
    return validatedName;
  }

  const expiresAt = parseFutureExpirationDate(req, expiresAtInput);
  if (!expiresAt.ok) {
    return expiresAt;
  }

  return {
    ok: true,
    input: {
      name: validatedName.value,
      description: description?.trim() || undefined,
      expiresAt: expiresAt.input,
    },
  };
}

export async function parseUpdateSystemApiKeyRequest(req: NextRequest): Promise<ParsedRequest<SystemApiKeyUpdates>> {
  const body = await readRequestJsonObject(req);
  const updates: SystemApiKeyUpdates = {};

  if ('name' in body) {
    const name = readOptionalString(body.name);
    const validatedName = validateApiKeyName(req, name, 'Name cannot be empty');
    if (!validatedName.ok) {
      return validatedName;
    }
    updates.name = validatedName.value;
  }

  if ('description' in body) {
    if (body.description !== null && typeof body.description !== 'string') {
      return validationError(req, 'Description must be a string or null');
    }
    updates.description = body.description?.trim() || null;
  }

  if (typeof body.isActive === 'boolean') {
    updates.isActive = body.isActive;
  }

  if ('expiresAt' in body) {
    if (body.expiresAt === null) {
      updates.expiresAt = null;
    } else if (typeof body.expiresAt !== 'string') {
      return validationError(req, 'Invalid expiration date format');
    } else {
      const expiresAt = parseExpirationDate(req, body.expiresAt);
      if (!expiresAt.ok) {
        return expiresAt;
      }
      updates.expiresAt = expiresAt.input;
    }
  }

  if (Object.keys(updates).length === 0) {
    return validationError(req, 'No valid updates provided');
  }

  return { ok: true, input: updates };
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function validateApiKeyName(req: NextRequest, name: string | undefined, requiredMessage: string) {
  if (!name || name.trim().length === 0) {
    return validationError(req, requiredMessage);
  }

  if (name.length > 100) {
    return validationError(req, 'Name must be 100 characters or less');
  }

  return { ok: true as const, value: name.trim() };
}

function parseFutureExpirationDate(req: NextRequest, rawValue: string | undefined) {
  const parsed = parseExpirationDate(req, rawValue);
  if (!parsed.ok || !parsed.input) {
    return parsed;
  }

  if (parsed.input <= new Date()) {
    return validationError(req, 'Expiration date must be in the future');
  }

  return parsed;
}

function parseExpirationDate(req: NextRequest, rawValue: string | undefined): ParsedRequest<Date | null> {
  if (!rawValue) {
    return { ok: true, input: null };
  }

  const expiresAt = new Date(rawValue);
  if (Number.isNaN(expiresAt.getTime())) {
    return validationError(req, 'Invalid expiration date format');
  }

  return { ok: true, input: expiresAt };
}

function validationError(req: NextRequest, message: string) {
  return {
    ok: false as const,
    response: SimpleErrorHandler.handleApiError(req, createValidationError(message)),
  };
}
