import type { TreeItemFormData, TreeItemRequestBody, TreeNodeData, TreeScoreLabels } from './tree-view-types';

export const TREE_ICON_MAX_BYTES = 2 * 1024 * 1024;

export const EMPTY_SCORE_LABELS: TreeScoreLabels = {
  '1': '',
  '2': '',
  '3': '',
  '4': '',
  '5': '',
};

export function createDefaultTreeItemFormData(categoryId = 'none'): TreeItemFormData {
  return {
    name: '',
    description: '',
    shortDescription: '',
    maxScore: 100,
    skillType: 'hard_skill',
    categoryId,
    iconUrl: '',
    scoreLabels: { ...EMPTY_SCORE_LABELS },
  };
}

export function createTreeItemFormDataFromNode(node: TreeNodeData): TreeItemFormData {
  return {
    name: node.name,
    description: node.description || '',
    shortDescription: node.shortDescription || '',
    maxScore: node.maxScore || 100,
    skillType: node.skillType || 'hard_skill',
    categoryId: node.categoryId || node.groupId || 'none',
    iconUrl: node.iconUrl || '',
    scoreLabels: normalizeTreeScoreLabels(node.scoreLabels),
  };
}

export function buildTreeItemRequestBody(formData: TreeItemFormData, isPersonalityTraits: boolean) {
  const requestBody: TreeItemRequestBody = {
    name: formData.name.trim(),
    description: formData.description || null,
  };

  if (isPersonalityTraits) {
    requestBody.shortDescription = formData.shortDescription || null;
    requestBody.scoreLabels = formData.scoreLabels;
    requestBody.groupId = formData.categoryId === 'none' ? null : formData.categoryId;
    requestBody.iconUrl = formData.iconUrl || null;
  } else {
    requestBody.maxScore = formData.maxScore || 100;
    requestBody.skillType = formData.skillType || 'hard_skill';
    requestBody.groupId = formData.categoryId === 'none' ? null : formData.categoryId;
  }

  return requestBody;
}

export function getTreeIconFileValidationError(file: Pick<File, 'size' | 'type'> | null | undefined) {
  if (!file || !file.type.startsWith('image/')) {
    return 'Please select an image file';
  }

  if (file.size > TREE_ICON_MAX_BYTES) {
    return 'Image size must be less than 2MB';
  }

  return null;
}

export function getTreeCreateErrorMessage(errorData: unknown, fallbackMessage: string) {
  if (!errorData || typeof errorData !== 'object') {
    return fallbackMessage;
  }

  const error = errorData as { message?: unknown; error?: unknown };
  return typeof error.message === 'string'
    ? error.message
    : typeof error.error === 'string'
      ? error.error
      : fallbackMessage;
}

export function getTreeTargetFolderGroupId(targetFolder: Pick<TreeNodeData, 'id'>) {
  return targetFolder.id === 'ungrouped' ? null : targetFolder.id;
}

export function buildTreeItemGroupUpdateEndpoint(isPersonalityTraits: boolean, itemId: string) {
  return isPersonalityTraits
    ? `/api/v1/evaluation/personality-traits/${itemId}`
    : `/api/v1/evaluation/expertise-skills/${itemId}`;
}

function normalizeTreeScoreLabels(scoreLabels: Partial<TreeScoreLabels> | null | undefined): TreeScoreLabels {
  return {
    ...EMPTY_SCORE_LABELS,
    ...(scoreLabels || {}),
  };
}
