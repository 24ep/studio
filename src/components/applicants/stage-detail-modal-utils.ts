import type { TransitionRecord } from '@/lib/types';

export function getStageDetailRecordCountLabel(count: number) {
  return `${count} transition record${count > 1 ? 's' : ''} for this stage`;
}

export function getStageDetailEditDateValue(record: TransitionRecord, fallbackDate = new Date()) {
  const sourceDate = record.date ? new Date(record.date) : fallbackDate;
  return sourceDate.toISOString().slice(0, 16);
}

export function getStageDetailTimestampLabel(record: TransitionRecord) {
  return record.date ? new Date(record.date).toLocaleString() : 'Unknown time';
}

export function getStageDetailActorName(record: TransitionRecord) {
  return record.actingUserName || 'Unknown';
}
