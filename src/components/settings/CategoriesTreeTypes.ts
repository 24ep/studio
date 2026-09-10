export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  children?: Category[];
  items?: CategoryItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  categoryId?: string;
  groupId?: string;
}

export interface CategoryFormData {
  name: string;
}

export interface CategoryItemFormData {
  name: string;
  categoryId: string;
  groupId: string;
}
