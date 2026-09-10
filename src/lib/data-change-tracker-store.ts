import type { TrackedRecord } from './realtime-event-types';

interface DataSnapshot {
  timestamp: number;
  data: TrackedRecord;
  hash: string;
}

interface ChangeTracker {
  lastSnapshot: DataSnapshot | null;
  lastBroadcast: number;
  minBroadcastInterval: number;
}

const changeTrackers = new Map<string, ChangeTracker>();

export function generateTrackedDataHash(data: TrackedRecord): string {
  return JSON.stringify(data, Object.keys(data).sort());
}

export function omitTrackedFields(data: TrackedRecord, ignoreFields: string[]) {
  const filteredData = { ...data };
  ignoreFields.forEach(field => {
    delete filteredData[field];
  });
  return filteredData;
}

export function hasTrackedDataChanged(
  trackerKey: string,
  newData: TrackedRecord,
  options: {
    minBroadcastInterval?: number;
    ignoreFields?: string[];
  } = {}
): boolean {
  const {
    minBroadcastInterval = 1000,
    ignoreFields = [],
  } = options;

  const now = Date.now();
  let tracker = changeTrackers.get(trackerKey);

  if (!tracker) {
    tracker = {
      lastSnapshot: null,
      lastBroadcast: 0,
      minBroadcastInterval,
    };
    changeTrackers.set(trackerKey, tracker);
  }

  if (now - tracker.lastBroadcast < minBroadcastInterval) {
    return false;
  }

  const filteredData = omitTrackedFields(newData, ignoreFields);
  const newHash = generateTrackedDataHash(filteredData);

  if (!tracker.lastSnapshot) {
    tracker.lastSnapshot = {
      timestamp: now,
      data: filteredData,
      hash: newHash,
    };
    return true;
  }

  if (tracker.lastSnapshot.hash !== newHash) {
    tracker.lastSnapshot = {
      timestamp: now,
      data: filteredData,
      hash: newHash,
    };
    tracker.lastBroadcast = now;
    return true;
  }

  return false;
}

export function getChangeTrackingStats() {
  return {
    totalTrackers: changeTrackers.size,
    trackers: Array.from(changeTrackers.entries()).map(([key, tracker]) => ({
      key,
      lastBroadcast: tracker.lastBroadcast,
      lastBroadcastAgo: Date.now() - tracker.lastBroadcast,
      hasSnapshot: !!tracker.lastSnapshot,
    })),
  };
}

export function cleanupOldTrackers(maxAge: number = 30 * 60 * 1000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, tracker] of changeTrackers.entries()) {
    if (now - tracker.lastBroadcast > maxAge) {
      changeTrackers.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

export function clearChangeTrackersForTest() {
  changeTrackers.clear();
}
