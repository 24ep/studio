"use client";

import type { ChangeEvent } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TreeCategoryOption } from "./TreeCategorySelect";
import { DialogActionFooter } from "./TreeViewNodeConfirmationDialogs";
import { TreeItemFormFields } from "./TreeItemFormFields";
import type { TreeItemFormData } from "./tree-view-utils";

export {
  ConfirmationDialog,
  TreeNodeDeleteDialog,
} from "./TreeViewNodeConfirmationDialogs";

interface TreeNodeCreateDialogProps {
  open: boolean;
  itemTitle: string;
  categories: TreeCategoryOption[];
  formData: TreeItemFormData;
  isPersonalityTraits: boolean;
  showAdvancedConfig: boolean;
  iconFile: File | null;
  iconPreview: string | null;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (formData: TreeItemFormData) => void;
  onAdvancedConfigOpenChange: (open: boolean) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveIcon: () => void;
  onSubmit: () => void;
}

interface TreeNodeEditDialogProps extends TreeNodeCreateDialogProps {
  categoryTitle: string;
  isFolder: boolean;
}

export function TreeNodeCreateDialog({
  open,
  itemTitle,
  categories,
  formData,
  isPersonalityTraits,
  showAdvancedConfig,
  iconFile,
  iconPreview,
  onOpenChange,
  onFormDataChange,
  onAdvancedConfigOpenChange,
  onFileUpload,
  onRemoveIcon,
  onSubmit,
}: TreeNodeCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create {itemTitle}</DialogTitle>
          <DialogDescription>
            Create a new {itemTitle.toLowerCase()} in this category
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <TreeItemFormFields
            idPrefix="create"
            formData={formData}
            categories={categories}
            categoryEmptyMessage="No categories available. Create a category first."
            isPersonalityTraits={isPersonalityTraits}
            showAdvancedConfig={showAdvancedConfig}
            iconFile={iconFile}
            iconPreview={iconPreview}
            validateSelectedCategory
            onFormDataChange={onFormDataChange}
            onAdvancedConfigOpenChange={onAdvancedConfigOpenChange}
            onFileUpload={onFileUpload}
            onRemoveIcon={onRemoveIcon}
          />
        </div>
        <DialogActionFooter
          cancelLabel="Cancel"
          submitLabel={`Create ${itemTitle.slice(0, -1)}`}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export function TreeNodeEditDialog({
  open,
  itemTitle,
  categoryTitle,
  categories,
  isFolder,
  isPersonalityTraits,
  formData,
  showAdvancedConfig,
  iconFile,
  iconPreview,
  onOpenChange,
  onFormDataChange,
  onAdvancedConfigOpenChange,
  onFileUpload,
  onRemoveIcon,
  onSubmit,
}: TreeNodeEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {isFolder ? categoryTitle : itemTitle}</DialogTitle>
          <DialogDescription>
            Update the {isFolder ? categoryTitle.toLowerCase() : itemTitle.toLowerCase()} details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isFolder ? (
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
              />
            </div>
          ) : (
            <TreeItemFormFields
              idPrefix="edit"
              formData={formData}
              categories={categories}
              categoryEmptyMessage="No categories available"
              isPersonalityTraits={isPersonalityTraits}
              showAdvancedConfig={showAdvancedConfig}
              iconFile={iconFile}
              iconPreview={iconPreview}
              showSkillType
              onFormDataChange={onFormDataChange}
              onAdvancedConfigOpenChange={onAdvancedConfigOpenChange}
              onFileUpload={onFileUpload}
              onRemoveIcon={onRemoveIcon}
            />
          )}
        </div>
        <DialogActionFooter
          cancelLabel="Cancel"
          submitLabel="Update"
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
