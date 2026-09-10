"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import {
  CategoryFormFields,
  CategoryItemFormFields,
  type Category,
  type CategoryFormData,
  type CategoryItemFormData,
} from "./CategoriesTreeParts";

interface CategoryDialogProps {
  open: boolean;
  mode: "create" | "edit";
  categoryTitle: string;
  itemTitle: string;
  formData: CategoryFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: CategoryFormData) => void;
  onSubmit: () => void;
}

export function CategoryDialog({
  open,
  mode,
  categoryTitle,
  itemTitle,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: CategoryDialogProps) {
  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create" : "Edit"} {categoryTitle}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? `Create a new category to organize related ${itemTitle.toLowerCase()}`
              : `Update the ${categoryTitle.toLowerCase()} details`}
          </DialogDescription>
        </DialogHeader>
        <CategoryFormFields
          formData={formData}
          categoryTitle={categoryTitle}
          onChange={onFormDataChange}
          idPrefix={`${mode}-category`}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{isCreate ? "Create" : "Update"} Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryItemDialogProps {
  open: boolean;
  mode: "create" | "edit";
  itemTitle: string;
  categories: Category[];
  formData: CategoryItemFormData;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: CategoryItemFormData) => void;
  onSubmit: () => void;
}

export function CategoryItemDialog({
  open,
  mode,
  itemTitle,
  categories,
  formData,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: CategoryItemDialogProps) {
  const isCreate = mode === "create";
  const itemSingular = itemTitle.slice(0, -1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create" : "Edit"} {itemTitle}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? `Create a new ${itemTitle.toLowerCase()} with all the necessary details`
              : `Update the ${itemTitle.toLowerCase()} details`}
          </DialogDescription>
        </DialogHeader>
        <CategoryItemFormFields
          formData={formData}
          categories={categories}
          onChange={onFormDataChange}
          idPrefix={`${mode}-item`}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isCreate ? "Create" : "Update"} {itemSingular}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
