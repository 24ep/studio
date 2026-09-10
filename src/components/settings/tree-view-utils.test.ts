import { describe, expect, it } from 'vitest';

import {
  buildTreeDataFromCategoriesAndItems,
  buildTreeItemGroupUpdateEndpoint,
  buildTreeItemRequestBody,
  createDefaultTreeItemFormData,
  createTreeItemFormDataFromNode,
  findTreeNodeWithParent,
  getTreeCreateErrorMessage,
  getTreeDragAction,
  getTreeIconFileValidationError,
  getTreeNodeNameById,
  getTreeTargetFolderGroupId,
  moveTreeItemToFolder,
  reorderTreeFolderChildren,
  reorderTreeRootFolders,
  toggleTreeFolderExpanded,
} from './tree-view-utils';

describe('tree view utilities', () => {
  it('creates default item form data with an optional category', () => {
    expect(createDefaultTreeItemFormData('category-1')).toMatchObject({
      name: '',
      maxScore: 100,
      skillType: 'hard_skill',
      categoryId: 'category-1',
      scoreLabels: { '1': '', '2': '', '3': '', '4': '', '5': '' },
    });
  });

  it('maps an existing tree node into editable form data', () => {
    expect(createTreeItemFormDataFromNode({
      id: 'skill-1',
      name: 'Communication',
      type: 'file',
      groupId: 'group-1',
      maxScore: 50,
      skillType: 'test_score',
      scoreLabels: { '1': 'low' },
    })).toMatchObject({
      name: 'Communication',
      categoryId: 'group-1',
      maxScore: 50,
      skillType: 'test_score',
      scoreLabels: { '1': 'low', '2': '', '3': '', '4': '', '5': '' },
    });
  });

  it('builds request bodies for skills and personality traits', () => {
    const formData = {
      ...createDefaultTreeItemFormData('group-1'),
      name: 'Ownership',
      description: 'Takes responsibility',
      shortDescription: 'Owns work',
      iconUrl: '/icon.svg',
    };

    expect(buildTreeItemRequestBody(formData, false)).toEqual({
      name: 'Ownership',
      description: 'Takes responsibility',
      maxScore: 100,
      skillType: 'hard_skill',
      groupId: 'group-1',
    });

    expect(buildTreeItemRequestBody(formData, true)).toMatchObject({
      name: 'Ownership',
      description: 'Takes responsibility',
      shortDescription: 'Owns work',
      groupId: 'group-1',
      iconUrl: '/icon.svg',
    });
  });

  it('validates icon uploads and normalizes create errors', () => {
    expect(getTreeIconFileValidationError({ type: 'text/plain', size: 100 })).toBe('Please select an image file');
    expect(getTreeIconFileValidationError({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toBe('Image size must be less than 2MB');
    expect(getTreeIconFileValidationError({ type: 'image/png', size: 1024 })).toBeNull();

    expect(getTreeCreateErrorMessage({ message: 'Message wins' }, 'Fallback')).toBe('Message wins');
    expect(getTreeCreateErrorMessage({ error: 'Error fallback' }, 'Fallback')).toBe('Error fallback');
    expect(getTreeCreateErrorMessage(null, 'Fallback')).toBe('Fallback');
  });

  it('builds tree item group update endpoints and target group ids', () => {
    expect(buildTreeItemGroupUpdateEndpoint(true, 'trait-1')).toBe('/api/v1/evaluation/personality-traits/trait-1');
    expect(buildTreeItemGroupUpdateEndpoint(false, 'skill-1')).toBe('/api/v1/evaluation/expertise-skills/skill-1');
    expect(getTreeTargetFolderGroupId({ id: 'ungrouped' })).toBeNull();
    expect(getTreeTargetFolderGroupId({ id: 'group-1' })).toBe('group-1');
  });

  it('builds tree data from categories and ungrouped items', () => {
    const tree = buildTreeDataFromCategoriesAndItems([
      { id: 'group-1', name: 'Frontend', sortOrder: 1 },
    ], [
      { id: 'skill-1', name: 'React', groupId: 'group-1', sortOrder: 0, scoreLabels: { '1': 'low' } },
      { id: 'skill-2', name: 'Ungrouped skill' },
    ]);

    expect(tree).toMatchObject([
      {
        id: 'group-1',
        name: 'Frontend',
        type: 'folder',
        isExpanded: true,
        children: [
          { id: 'skill-1', name: 'React', type: 'file', groupId: 'group-1', scoreLabels: { '1': 'low' } },
        ],
      },
      {
        id: 'ungrouped',
        name: 'No Group',
        type: 'folder',
        sortOrder: 999999,
        children: [
          { id: 'skill-2', name: 'Ungrouped skill', type: 'file' },
        ],
      },
    ]);
  });

  it('toggles folder expansion immutably', () => {
    expect(toggleTreeFolderExpanded([
      { id: 'folder-1', name: 'Folder 1', type: 'folder', isExpanded: true },
      { id: 'folder-2', name: 'Folder 2', type: 'folder', isExpanded: false },
    ], 'folder-1')).toMatchObject([
      { id: 'folder-1', isExpanded: false },
      { id: 'folder-2', isExpanded: false },
    ]);
  });

  it('reorders root folders and folder children with sort orders', () => {
    const tree = [
      {
        id: 'folder-1',
        name: 'Folder 1',
        type: 'folder' as const,
        children: [
          { id: 'file-1', name: 'File 1', type: 'file' as const, sortOrder: 0 },
          { id: 'file-2', name: 'File 2', type: 'file' as const, sortOrder: 1 },
        ],
      },
      { id: 'folder-2', name: 'Folder 2', type: 'folder' as const },
    ];

    expect(reorderTreeRootFolders(tree, 'folder-2', 'folder-1')).toMatchObject([
      { id: 'folder-2', sortOrder: 0 },
      { id: 'folder-1', sortOrder: 1 },
    ]);
    expect(reorderTreeFolderChildren(tree, 'folder-1', 'file-2', 'file-1')[0].children).toMatchObject([
      { id: 'file-2', sortOrder: 0 },
      { id: 'file-1', sortOrder: 1 },
    ]);
  });

  it('finds nested tree nodes with parent context', () => {
    const tree = [
      {
        id: 'folder-1',
        name: 'Folder',
        type: 'folder' as const,
        children: [
          { id: 'file-1', name: 'File', type: 'file' as const },
        ],
      },
    ];

    expect(findTreeNodeWithParent(tree, 'folder-1')).toEqual({
      node: tree[0],
      parent: null,
    });
    expect(findTreeNodeWithParent(tree, 'file-1')).toEqual({
      node: tree[0].children![0],
      parent: tree[0],
    });
    expect(findTreeNodeWithParent(tree, 'missing')).toBeNull();
    expect(getTreeNodeNameById(tree, 'file-1')).toBe('File');
    expect(getTreeNodeNameById(tree, 'missing')).toBe('');
  });

  it('moves a tree item to another folder immutably', () => {
    const tree = [
      {
        id: 'folder-1',
        name: 'Folder 1',
        type: 'folder' as const,
        children: [
          { id: 'file-1', name: 'File 1', type: 'file' as const, groupId: 'folder-1' },
        ],
      },
      {
        id: 'folder-2',
        name: 'Folder 2',
        type: 'folder' as const,
        children: [],
      },
    ];

    const movedTree = moveTreeItemToFolder(tree, 'file-1', 'folder-2');

    expect(tree[0].children).toHaveLength(1);
    expect(movedTree[0].children).toEqual([]);
    expect(movedTree[1].children).toMatchObject([
      {
        id: 'file-1',
        groupId: 'folder-2',
        categoryId: 'folder-2',
        parentId: 'folder-2',
      },
    ]);
  });

  it('classifies supported tree drag actions', () => {
    const tree = [
      {
        id: 'folder-1',
        name: 'Folder 1',
        type: 'folder' as const,
        children: [
          { id: 'file-1', name: 'File 1', type: 'file' as const },
          { id: 'file-2', name: 'File 2', type: 'file' as const },
        ],
      },
      {
        id: 'folder-2',
        name: 'Folder 2',
        type: 'folder' as const,
        children: [],
      },
    ];

    expect(getTreeDragAction(tree, 'file-1', 'folder-2')).toMatchObject({
      type: 'move-file-to-folder',
      activeItem: tree[0].children![0],
      targetItem: tree[1],
      activeParent: tree[0],
    });
    expect(getTreeDragAction(tree, 'file-1', 'file-2')).toMatchObject({
      type: 'reorder-files-in-folder',
      targetParent: tree[0],
    });
    expect(getTreeDragAction(tree, 'folder-1', 'folder-2')).toMatchObject({
      type: 'reorder-folders',
      activeItem: tree[0],
      targetItem: tree[1],
    });
    expect(getTreeDragAction(tree, 'folder-1', 'file-1')).toEqual({
      type: 'unsupported-folder-drop',
    });
    expect(getTreeDragAction(tree, 'file-1', 'file-1')).toBeNull();
    expect(getTreeDragAction(tree, 'missing', 'folder-1')).toBeNull();
  });
});
