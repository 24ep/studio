export function areStringArraysEquivalent(first?: string[] | null, second?: string[] | null) {
  const safeFirst = Array.isArray(first) ? first : [];
  const safeSecond = Array.isArray(second) ? second : [];
  if (safeFirst.length !== safeSecond.length) return false;

  const remainingValues = countStringValues(safeFirst);
  return safeSecond.every(value => consumeStringValue(remainingValues, value)) &&
    remainingValues.size === 0;
}

function countStringValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return counts;
}

function consumeStringValue(counts: Map<string, number>, value: string) {
  const remainingCount = counts.get(value);
  if (!remainingCount) return false;

  if (remainingCount === 1) {
    counts.delete(value);
    return true;
  }

  counts.set(value, remainingCount - 1);
  return true;
}
