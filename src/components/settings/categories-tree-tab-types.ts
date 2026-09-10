import type {
  Category,
  CategoryFormData,
  CategoryItem,
  CategoryItemFormData,
} from "./CategoriesTreeParts";

export interface UseCategoriesTreeTabOptions {
  categoryTitle: string;
  itemTitle: string;
  categoriesEndpoint: string;
  itemsEndpoint: string;
}

export interface CategoriesTreeDialogState {
  categoryFormData: CategoryFormData;
  isCreateCategoryDialogOpen: boolean;
  isCreateItemDialogOpen: boolean;
  isEditCategoryDialogOpen: boolean;
  isEditItemDialogOpen: boolean;
  itemFormData: CategoryItemFormData;
  selectedCategory: Category | null;
  selectedItem: CategoryItem | null;
  setCategoryFormData: (formData: CategoryFormData) => void;
  setIsCreateCategoryDialogOpen: (open: boolean) => void;
  setIsCreateItemDialogOpen: (open: boolean) => void;
  setIsEditCategoryDialogOpen: (open: boolean) => void;
  setIsEditItemDialogOpen: (open: boolean) => void;
  setItemFormData: (formData: CategoryItemFormData) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedItem: (item: CategoryItem | null) => void;
  openEditCategoryDialog: (category: Category) => void;
  openEditItemDialog: (item: CategoryItem) => void;
}

export interface CategoriesTreeReloaders {
  fetchCategories: () => Promise<void>;
  fetchItems: () => Promise<void>;
}
