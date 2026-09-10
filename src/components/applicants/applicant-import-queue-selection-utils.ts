import type { UploadQueueItemLike } from './applicant-import-queue-util-types';

export function getUploadQueueSelectionMode(selectedItems: Set<string>, items?: UploadQueueItemLike[] | null) {
  if (!items?.length || selectedItems.size === 0) {
    return 'none' as const;
  }

  return selectedItems.size === items.length ? 'all' as const : 'partial' as const;
}

export function toggleUploadQueueSelectAll(
  selectedItems: Set<string>,
  items: UploadQueueItemLike[] = [],
  selectionMode: 'none' | 'partial' | 'all',
) {
  return selectionMode === 'all'
    ? new Set<string>()
    : new Set(items.map((item) => item.id));
}

export function toggleUploadQueueSelectedItem(selectedItems: Set<string>, itemId: string) {
  const nextSelectedItems = new Set(selectedItems);

  if (nextSelectedItems.has(itemId)) {
    nextSelectedItems.delete(itemId);
  } else {
    nextSelectedItems.add(itemId);
  }

  return nextSelectedItems;
}
