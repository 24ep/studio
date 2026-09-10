// Data Change Detection System for SSE Events
// Only broadcasts when there are actual meaningful changes

import { broadcast as broadcastAll } from './realtime';
import { broadcastMediumPriority, broadcastHighPriority } from './aggressive-sse-optimizer';
import type { EventPayload, TrackedItem, TrackedRecord, UnifiedEventType } from './realtime-event-types';
import {
  cleanupOldTrackers,
  getChangeTrackingStats,
  hasTrackedDataChanged,
} from './data-change-tracker-store';

export { cleanupOldTrackers, getChangeTrackingStats } from './data-change-tracker-store';

const globalChangeTrackerState = globalThis as unknown as {
  __changeTrackerCleanupInterval?: NodeJS.Timeout;
};

// Smart broadcast functions that only send when data changes
export function broadcastApplicantUpdateIfChanged(
  applicant: TrackedRecord & { id?: string | number }, 
  actingUserId?: string,
  options: { minBroadcastInterval?: number; ignoreFields?: string[] } = {}
) {
  const trackerKey = `Applicant_${String(applicant.id)}`;
  
  if (hasTrackedDataChanged(trackerKey, applicant, {
    minBroadcastInterval: options.minBroadcastInterval || 500, // 500ms for Applicants
    ignoreFields: ['updated_at', 'last_activity', ...(options.ignoreFields || [])]
  })) {
    broadcastMediumPriority('Applicant_update', {
      applicant: applicant,
      actingUserId,
      action: 'updated',
      timestamp: new Date().toISOString()
    });
  }
}

export function broadcastPositionUpdateIfChanged(
  position: TrackedRecord & { id?: string | number }, 
  actingUserId?: string,
  options: { minBroadcastInterval?: number; ignoreFields?: string[] } = {}
) {
  const trackerKey = `position_${String(position.id)}`;
  
  if (hasTrackedDataChanged(trackerKey, position, {
    minBroadcastInterval: options.minBroadcastInterval || 500, // 500ms for positions
    ignoreFields: ['updated_at', 'last_activity', ...(options.ignoreFields || [])]
  })) {
    broadcastHighPriority('position_update', {
      position,
      actingUserId,
      action: 'updated',
      timestamp: new Date().toISOString()
    });
  }
}

export function broadcastUploadQueueUpdateIfChanged(
  summary: TrackedRecord,
  options: { minBroadcastInterval?: number; ignoreFields?: string[] } = {}
) {
  const trackerKey = 'upload_queue_summary';
  
  if (hasTrackedDataChanged(trackerKey, summary, {
    minBroadcastInterval: options.minBroadcastInterval || 100, // Reduced to 100ms for faster updates
    ignoreFields: ['timestamp', ...(options.ignoreFields || [])]
  })) {
    // Use forceBroadcast to bypass all throttling for upload queue updates
    forceBroadcast('upload_queue_update', {
      type: 'queue',
      summary,
      timestamp: new Date().toISOString()
    });
  }
}

export function broadcastDashboardUpdateIfChanged(
  data: EventPayload,
  options: { minBroadcastInterval?: number; ignoreFields?: string[] } = {}
) {
  const trackerKey = 'dashboard_data';
  
  if (hasTrackedDataChanged(trackerKey, data, {
    minBroadcastInterval: options.minBroadcastInterval || 200, // 200ms for dashboard (reduced for better real-time updates)
    ignoreFields: ['timestamp', 'last_updated', ...(options.ignoreFields || [])]
  })) {
    broadcastMediumPriority('dashboard_update', { // Changed from low to medium priority
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Batch change detection for multiple items
export function broadcastBatchUpdateIfChanged(
  items: TrackedItem[],
  itemType: 'applicant' | 'position',
  actingUserId?: string,
  options: { minBroadcastInterval?: number; ignoreFields?: string[] } = {}
) {
  const trackerKey = `${itemType}_batch_${items.length}`;
  const batchData = {
    items: items.map(item => ({ id: item.id, status: item.status, updated_at: item.updated_at })),
    count: items.length,
    timestamp: new Date().toISOString()
  };
  
  if (hasTrackedDataChanged(trackerKey, batchData, {
    minBroadcastInterval: options.minBroadcastInterval || 500, // 500ms for batch updates
    ignoreFields: ['timestamp', ...(options.ignoreFields || [])]
  })) {
    broadcastAll({ type: `${itemType}_update`, items, actingUserId, action: 'batch_updated', timestamp: new Date().toISOString() }, `${itemType}_update`);
  }
}

// Force broadcast (bypass change detection)
export function forceBroadcast(eventType: UnifiedEventType, data: EventPayload, targetUserId?: string) {
  if (!targetUserId) {
    broadcastAll({ type: eventType, ...data }, eventType);
  }
}

// Auto-cleanup every 10 minutes, with process-level dedupe to avoid duplicate timers.
if (!globalChangeTrackerState.__changeTrackerCleanupInterval) {
  globalChangeTrackerState.__changeTrackerCleanupInterval = setInterval(() => {
    cleanupOldTrackers();
  }, 10 * 60 * 1000);
  globalChangeTrackerState.__changeTrackerCleanupInterval.unref?.();
}
