export function insertItemAt<T>(items: T[], item: T, insertionIndex: number) {
  const next = [...items];
  const safeIndex = Math.max(0, Math.min(insertionIndex, next.length));
  next.splice(safeIndex, 0, item);
  return next;
}

export function moveItemToInsertionIndex<T>(
  items: T[],
  sourceIndex: number,
  insertionIndex: number,
) {
  if (sourceIndex < 0 || sourceIndex >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(sourceIndex, 1);
  const adjustedIndex = sourceIndex < insertionIndex
    ? insertionIndex - 1
    : insertionIndex;
  const safeIndex = Math.max(0, Math.min(adjustedIndex, next.length));
  next.splice(safeIndex, 0, item);
  return next;
}
