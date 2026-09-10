import type { TreeCategorySource, TreeItemSource, TreeNodeData } from './tree-view-types';

export function buildTreeDataFromCategoriesAndItems(
  categoriesData: TreeCategorySource[] | null | undefined,
  itemsData: TreeItemSource[] | null | undefined,
  ungroupedName = 'No Group'
): TreeNodeData[] {
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const items = Array.isArray(itemsData) ? itemsData : [];

  const treeData: TreeNodeData[] = categories.map(category => ({
    id: category.id,
    name: category.name,
    type: 'folder',
    sortOrder: category.sortOrder,
    isExpanded: true,
    children: items
      .filter(item => item.categoryId === category.id || item.groupId === category.id)
      .map(createFileNodeFromItem),
  }));

  const ungroupedItems = items.filter(item => !item.categoryId && !item.groupId);
  if (ungroupedItems.length > 0) {
    treeData.push({
      id: 'ungrouped',
      name: ungroupedName,
      type: 'folder',
      sortOrder: 999999,
      isExpanded: true,
      children: ungroupedItems.map(createFileNodeFromItem),
    });
  }

  return treeData;
}

export function toggleTreeFolderExpanded(nodes: TreeNodeData[], nodeId: string) {
  return nodes.map(node => (
    node.id === nodeId
      ? { ...node, isExpanded: !node.isExpanded }
      : node
  ));
}

export function findTreeNodeWithParent(
  nodes: TreeNodeData[],
  nodeId: string,
  parent: TreeNodeData | null = null
): { node: TreeNodeData; parent: TreeNodeData | null } | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return { node, parent };
    }

    if (node.children) {
      const childMatch = findTreeNodeWithParent(node.children, nodeId, node);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
}

export function getTreeNodeNameById(nodes: TreeNodeData[], nodeId: string) {
  return findTreeNodeWithParent(nodes, nodeId)?.node.name || '';
}

function createFileNodeFromItem(item: TreeItemSource): TreeNodeData {
  return {
    id: item.id,
    name: item.name,
    type: 'file',
    categoryId: item.categoryId ?? undefined,
    groupId: item.groupId ?? undefined,
    sortOrder: item.sortOrder,
    description: item.description,
    shortDescription: item.shortDescription,
    maxScore: item.maxScore,
    skillType: item.skillType,
    iconUrl: item.iconUrl ?? undefined,
    scoreLabels: item.scoreLabels,
  };
}
