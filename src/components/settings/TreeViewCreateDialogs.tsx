"use client";

import type { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TreeCategoryOption } from './TreeCategorySelect';
import { TreeItemFormFields } from './TreeItemFormFields';
import type { TreeItemFormData } from './tree-view-utils';

interface TreeViewCreateDialogsProps {
  categoryTitle: string;
  itemTitle: string;
  categories: TreeCategoryOption[];
  isPersonalityTraits: boolean;
  categoryFormData: { name: string };
  setCategoryFormData: Dispatch<SetStateAction<{ name: string }>>;
  itemFormData: TreeItemFormData;
  setItemFormData: Dispatch<SetStateAction<TreeItemFormData>>;
  mainIconFile: File | null;
  mainIconPreview: string | null;
  showAdvancedConfigItem: boolean;
  setShowAdvancedConfigItem: Dispatch<SetStateAction<boolean>>;
  isCreateCategoryDialogOpen: boolean;
  setIsCreateCategoryDialogOpen: Dispatch<SetStateAction<boolean>>;
  isCreateItemDialogOpen: boolean;
  setIsCreateItemDialogOpen: Dispatch<SetStateAction<boolean>>;
  onCreateCategory: () => void;
  onCreateItem: () => void;
  onMainFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMainIcon: () => void;
}

export function TreeViewCreateDialogs({
  categoryTitle,
  itemTitle,
  categories,
  isPersonalityTraits,
  categoryFormData,
  setCategoryFormData,
  itemFormData,
  setItemFormData,
  mainIconFile,
  mainIconPreview,
  showAdvancedConfigItem,
  setShowAdvancedConfigItem,
  isCreateCategoryDialogOpen,
  setIsCreateCategoryDialogOpen,
  isCreateItemDialogOpen,
  setIsCreateItemDialogOpen,
  onCreateCategory,
  onCreateItem,
  onMainFileUpload,
  onRemoveMainIcon,
}: TreeViewCreateDialogsProps) {
  return (
    <div className="flex gap-2">
      <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create {categoryTitle}</DialogTitle>
            <DialogDescription>
              Create a new category to organize related {itemTitle.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryFormData.name}
                onChange={(event) => setCategoryFormData({ ...categoryFormData, name: event.target.value })}
                placeholder={`e.g., ${categoryTitle}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateItemDialogOpen} onOpenChange={setIsCreateItemDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create {itemTitle.slice(0, -1)}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create {itemTitle}</DialogTitle>
            <DialogDescription>
              Create a new {itemTitle.toLowerCase()} with all details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <TreeItemFormFields
              idPrefix="create-item"
              formData={itemFormData}
              categories={categories}
              categoryEmptyMessage="No categories available"
              isPersonalityTraits={isPersonalityTraits}
              showAdvancedConfig={showAdvancedConfigItem}
              iconFile={mainIconFile}
              iconPreview={mainIconPreview}
              onFormDataChange={setItemFormData}
              onAdvancedConfigOpenChange={setShowAdvancedConfigItem}
              onFileUpload={onMainFileUpload}
              onRemoveIcon={onRemoveMainIcon}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateItem}>Create {itemTitle.slice(0, -1)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
