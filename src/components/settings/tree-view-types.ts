export interface TreeNodeData {
  id: string;
  name: string;
  type: 'folder' | 'file';
  categoryId?: string;
  groupId?: string;
  sortOrder?: number;
  description?: string;
  shortDescription?: string;
  maxScore?: number;
  skillType?: 'hard_skill' | 'test_score';
  iconUrl?: string;
  scoreLabels?: Partial<TreeScoreLabels>;
  children?: TreeNodeData[];
  isExpanded?: boolean;
  parentId?: string;
}

export interface TreeScoreLabels {
  '1': string;
  '2': string;
  '3': string;
  '4': string;
  '5': string;
}

export interface TreeItemFormData {
  name: string;
  description: string;
  shortDescription: string;
  maxScore: number;
  skillType: 'hard_skill' | 'test_score';
  categoryId: string;
  iconUrl: string;
  scoreLabels: TreeScoreLabels;
}

export interface TreeCategorySource {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface TreeItemSource {
  id: string;
  name: string;
  categoryId?: string | null;
  groupId?: string | null;
  sortOrder?: number;
  description?: string;
  shortDescription?: string;
  maxScore?: number;
  skillType?: 'hard_skill' | 'test_score';
  iconUrl?: string | null;
  scoreLabels?: Partial<TreeScoreLabels>;
}

export interface TreeItemRequestBody {
  name: string;
  description: string | null;
  shortDescription?: string | null;
  scoreLabels?: TreeScoreLabels;
  groupId?: string | null;
  iconUrl?: string | null;
  maxScore?: number;
  skillType?: 'hard_skill' | 'test_score';
}

export type TreeDragAction =
  | {
      type: 'move-file-to-folder';
      activeItem: TreeNodeData;
      targetItem: TreeNodeData;
      activeParent: TreeNodeData | null;
    }
  | {
      type: 'reorder-files-in-folder';
      activeItem: TreeNodeData;
      targetItem: TreeNodeData;
      targetParent: TreeNodeData;
    }
  | {
      type: 'reorder-folders';
      activeItem: TreeNodeData;
      targetItem: TreeNodeData;
    }
  | {
      type: 'unsupported-folder-drop';
    };
