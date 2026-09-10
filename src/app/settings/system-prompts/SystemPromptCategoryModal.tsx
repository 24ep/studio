"use client";

import { Dispatch, SetStateAction } from 'react';
import { Save, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SystemPromptCategory, SystemPromptCategoryFormData } from './types';

interface SystemPromptCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: SystemPromptCategory | null;
  formData: SystemPromptCategoryFormData;
  setFormData: Dispatch<SetStateAction<SystemPromptCategoryFormData>>;
  onSave: () => void;
}

export function SystemPromptCategoryModal({
  open,
  onOpenChange,
  editingCategory,
  formData,
  setFormData,
  onSave,
}: SystemPromptCategoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? 'Update the category configuration.'
              : 'Create a new category for organizing system prompts.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Name *</Label>
            <Input
              id="categoryName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryDescription">Description</Label>
            <Input
              id="categoryDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter category description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <ColorPicker
              value={formData.color || '#3B82F6'}
              onChange={(color) => setFormData({ ...formData, color })}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="categoryIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-input accent-primary"
            />
            <Label htmlFor="categoryIsActive">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!formData.name}>
            <Save className="h-4 w-4 mr-2" />
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
