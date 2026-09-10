export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleDeleteUploadQueueItem,
  handlePatchUploadQueueItem,
  handleProcessUploadQueueItem,
} from './upload-queue-item-handlers';
import type { UploadQueueItemRouteContext } from './upload-queue-item-types';

/**
 * @openapi
 * /api/upload-queue/{id}:
 *   patch:
 *     summary: Update an upload queue job by ID
 *     description: Updates fields of an upload queue job by its ID. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the upload queue job
 *         example: "uuid"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 status: "processing"
 *     responses:
 *       200:
 *         description: Upload queue job updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   status: "processing"
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */

export function PATCH(request: NextRequest, context: UploadQueueItemRouteContext) {
  return handlePatchUploadQueueItem(request, context);
}

export function DELETE(request: NextRequest, context: UploadQueueItemRouteContext) {
  return handleDeleteUploadQueueItem(request, context);
}

export function POST(request: NextRequest, context: UploadQueueItemRouteContext) {
  return handleProcessUploadQueueItem(request, context);
} 
