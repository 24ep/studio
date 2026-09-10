function dateOnly(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new Error('Invalid roster date.');
  return date;
}

export function rosterCopyTargetDate(sourceDate: string, sourceStart: string, targetStart: string) {
  const source = dateOnly(sourceDate);
  const sourceAnchor = dateOnly(sourceStart);
  const targetAnchor = dateOnly(targetStart);
  const offsetDays = Math.round((source.getTime() - sourceAnchor.getTime()) / 86_400_000);
  targetAnchor.setUTCDate(targetAnchor.getUTCDate() + offsetDays);
  return targetAnchor.toISOString().slice(0, 10);
}

export function rosterCopyIdempotencyKey(sourceAssignmentId: string, targetStart: string) {
  return `roster-copy:${sourceAssignmentId}:${targetStart}`;
}
