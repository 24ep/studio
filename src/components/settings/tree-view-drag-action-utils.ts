import { findTreeNodeWithParent } from './tree-view-data-utils';
import type { TreeDragAction, TreeNodeData } from './tree-view-types';

type TreeNodeMatch = {
  node: TreeNodeData;
  parent: TreeNodeData | null;
};

type DragActionClassifier = {
  createAction: (active: TreeNodeMatch, target: TreeNodeMatch) => TreeDragAction;
  matches: (active: TreeNodeMatch, target: TreeNodeMatch) => boolean;
};

const TREE_DRAG_ACTION_CLASSIFIERS: DragActionClassifier[] = [
  {
    matches: (active, target) => active.node.type === 'file' && target.node.type === 'folder',
    createAction: (active, target) => ({
      type: 'move-file-to-folder',
      activeItem: active.node,
      targetItem: target.node,
      activeParent: active.parent,
    }),
  },
  {
    matches: (active, target) => (
      active.node.type === 'file'
      && target.node.type === 'file'
      && Boolean(target.parent)
    ),
    createAction: (active, target) => ({
      type: 'reorder-files-in-folder',
      activeItem: active.node,
      targetItem: target.node,
      targetParent: target.parent!,
    }),
  },
  {
    matches: (active, target) => active.node.type === 'folder' && target.node.type === 'folder',
    createAction: (active, target) => ({
      type: 'reorder-folders',
      activeItem: active.node,
      targetItem: target.node,
    }),
  },
  {
    matches: (active, target) => (
      active.node.type === 'folder'
      && target.node.type === 'file'
      && Boolean(target.parent)
    ),
    createAction: () => ({
      type: 'unsupported-folder-drop',
    }),
  },
];

export function getTreeDragAction(
  nodes: TreeNodeData[],
  activeId: string,
  overId: string
): TreeDragAction | null {
  if (activeId === overId) return null;

  const active = findTreeNodeWithParent(nodes, activeId);
  const target = findTreeNodeWithParent(nodes, overId);

  if (!active || !target) return null;

  const classifier = TREE_DRAG_ACTION_CLASSIFIERS.find((candidate) => candidate.matches(active, target));
  return classifier ? classifier.createAction(active, target) : null;
}
