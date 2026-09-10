import { findTreeNodeWithParent } from './tree-view-data-utils';
import { getTreeTargetFolderGroupId } from './tree-view-form-utils';
import type { TreeNodeData } from './tree-view-types';

export { getTreeDragAction } from './tree-view-drag-action-utils';

export function reorderTreeRootFolders(
  nodes: TreeNodeData[],
  activeFolderId: string,
  targetFolderId: string
) {
  return reorderById(nodes, activeFolderId, targetFolderId);
}

export function reorderTreeFolderChildren(
  nodes: TreeNodeData[],
  parentId: string,
  activeItemId: string,
  targetItemId: string
) {
  return nodes.map(node => (
    node.id === parentId
      ? {
        ...node,
        children: node.children
          ? reorderById(node.children, activeItemId, targetItemId)
          : node.children,
      }
      : node
  ));
}

export function moveTreeItemToFolder(
  nodes: TreeNodeData[],
  itemId: string,
  targetFolderId: string
) {
  const active = findTreeNodeWithParent(nodes, itemId);
  const target = findTreeNodeWithParent(nodes, targetFolderId);

  if (!active || !target || active.node.type !== 'file' || target.node.type !== 'folder') {
    return nodes;
  }

  const newGroupId = getTreeTargetFolderGroupId(target.node);
  const movedItem: TreeNodeData = {
    ...active.node,
    categoryId: newGroupId || undefined,
    groupId: newGroupId || undefined,
    parentId: target.node.id,
  };

  return nodes
    .filter(node => node.id !== itemId)
    .map(node => moveTreeItemInNode(node, itemId, targetFolderId, movedItem));
}

function reorderById<T extends { id: string; sortOrder?: number }>(
  items: T[],
  activeId: string,
  targetId: string
) {
  const oldIndex = items.findIndex(item => item.id === activeId);
  const newIndex = items.findIndex(item => item.id === targetId);

  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }

  const nextItems = [...items];
  const [reorderedItem] = nextItems.splice(oldIndex, 1);
  nextItems.splice(newIndex, 0, reorderedItem);

  return nextItems.map((item, index) => ({ ...item, sortOrder: index }));
}

function moveTreeItemInNode(
  node: TreeNodeData,
  itemId: string,
  targetFolderId: string,
  movedItem: TreeNodeData
) {
  const childrenWithoutMovedItem = node.children?.filter(child => child.id !== itemId);

  if (node.id === targetFolderId) {
    return {
      ...node,
      children: [...(childrenWithoutMovedItem || []), movedItem],
    };
  }

  return node.children
    ? { ...node, children: childrenWithoutMovedItem }
    : node;
}
