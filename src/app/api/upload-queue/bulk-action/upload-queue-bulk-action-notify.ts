import { broadcastUploadQueueUpdate } from '../sse/broadcastUploadQueueUpdate';

export async function broadcastUploadQueueBulkActionUpdate() {
  try {
    await broadcastUploadQueueUpdate();
  } catch (error) {
    console.error('Failed to broadcast upload queue update via SSE:', error);
  }
}
