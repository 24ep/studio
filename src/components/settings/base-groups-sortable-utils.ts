export function getSingularBaseItemTitle(itemTitle: string) {
  return itemTitle.endsWith('s') ? itemTitle.slice(0, -1) : itemTitle;
}
