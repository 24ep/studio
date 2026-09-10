import { NextResponse, type NextRequest } from 'next/server';
import { requireUploadQueueItemSession, requireUploadQueueManagePermission } from './upload-queue-item-auth';
import { deleteUploadQueueItem, processUploadQueueItem, updateUploadQueueItem } from './upload-queue-item-data';
import { broadcastUploadQueueUpdateSafely } from './upload-queue-item-events';
import { parseUploadQueuePatchBody, resolveUploadQueueItemId } from './upload-queue-item-request';
import type { UploadQueueItemRouteContext } from './upload-queue-item-types';

export async function handlePatchUploadQueueItem(request: NextRequest, context: UploadQueueItemRouteContext) {
  const session = await requireUploadQueueItemSession();
  if (!session.ok) {
    return session.response;
  }

  const id = await resolveUploadQueueItemId(context);
  const data = await parseUploadQueuePatchBody(request);
  const updateResult = await updateUploadQueueItem(id, data);

  if (updateResult.status === 'invalid-fields') {
    return NextResponse.json({
      error: 'Invalid fields for update',
      invalidFields: updateResult.invalidFields,
    }, { status: 400 });
  }

  if (updateResult.status === 'no-fields') {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (updateResult.status === 'not-found') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await broadcastUploadQueueUpdateSafely();
  return NextResponse.json(updateResult.item);
}

export async function handleDeleteUploadQueueItem(_request: NextRequest, context: UploadQueueItemRouteContext) {
  const session = await requireUploadQueueItemSession();
  if (!session.ok) {
    return session.response;
  }

  const id = await resolveUploadQueueItemId(context);

  try {
    const deleteResult = await deleteUploadQueueItem(id);
    if (deleteResult.status === 'not-found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (deleteResult.status === 'not-deletable') {
      return NextResponse.json({ error: 'Job is not in a deletable state' }, { status: 400 });
    }

    await broadcastUploadQueueUpdateSafely();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting upload queue job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}

export async function handleProcessUploadQueueItem(_request: NextRequest, context: UploadQueueItemRouteContext) {
  const session = await requireUploadQueueItemSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUploadQueueManagePermission(session.session);
  if (permissionError) {
    return permissionError;
  }

  const id = await resolveUploadQueueItemId(context);

  try {
    const processResult = await processUploadQueueItem(id);
    if (processResult.status === 'not-found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (processResult.status === 'not-processable') {
      return NextResponse.json({ error: 'Job is not in a processable state' }, { status: 400 });
    }

    if (processResult.status === 'duplicate-queued-file') {
      return NextResponse.json({
        error: 'Cannot retry job: there is already a queued job with the same file path',
      }, { status: 400 });
    }

    if (processResult.status === 'max-retries') {
      return NextResponse.json({
        error: 'Cannot retry job: maximum retry attempts (3) exceeded',
      }, { status: 400 });
    }

    await broadcastUploadQueueUpdateSafely();
    return NextResponse.json(processResult.result, { status: 200 });
  } catch (error) {
    console.error(`Error processing job ${id}:`, error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
