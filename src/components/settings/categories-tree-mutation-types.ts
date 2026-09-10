import type {
  CategoriesTreeDialogState,
  CategoriesTreeReloaders,
  UseCategoriesTreeTabOptions,
} from "./categories-tree-tab-types";

export interface CategoriesTreeMutationOptions
  extends UseCategoriesTreeTabOptions,
    CategoriesTreeReloaders {
  dialogs: CategoriesTreeDialogState;
}
