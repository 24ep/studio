import { NextRequest } from 'next/server';
import { createValidationError, SimpleErrorHandler } from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';
import { requireNotificationApiUser, requireNotificationSendPermission } from './notification-route-auth';
import { createNotificationOptionsResponse } from './notification-route-cors';
import {
  handleBulkNotificationRequest,
  handleNotificationListRequest,
  handleSingleNotificationRequest,
} from './notification-route-handlers';
import { isBulkNotificationBody } from './notification-route-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await requireNotificationApiUser(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const permissionError = requireNotificationSendPermission(request, authResult.user);
  if (permissionError) {
    return permissionError;
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return SimpleErrorHandler.handleApiError(request, createValidationError('Invalid JSON body'));
  }

  const body = bodyResult.value;
  if (isBulkNotificationBody(body)) {
    return handleBulkNotificationRequest(request, body, authResult.user);
  }

  return handleSingleNotificationRequest(request, body, authResult.user);
}

export async function GET(request: NextRequest) {
  const authResult = await requireNotificationApiUser(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  return handleNotificationListRequest(request, authResult.user);
}

export function OPTIONS(request: NextRequest) {
  return createNotificationOptionsResponse(request);
}
