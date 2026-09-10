import { broadcastUploadQueueUpdate } from '../sse/broadcastUploadQueueUpdate';

export async function broadcastUploadQueueUpdateSafely() {
  try {
    await broadcastUploadQueueUpdate();
  } catch (error) {
    console.error('Failed to broadcast upload queue update via SSE:', error);
  }
}
