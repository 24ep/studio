"use client";

import { Dispatch, SetStateAction } from 'react';
import { BrainCircuit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/ui/wysiwyg-editors';
import type { SystemPrompt, SystemPromptCategory, SystemPromptFormData } from './types';

interface SystemPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrompt: SystemPrompt | null;
  formData: SystemPromptFormData;
  setFormData: Dispatch<SetStateAction<SystemPromptFormData>>;
  categories: SystemPromptCategory[];
  onSave: () => void;
}

export function SystemPromptModal({
  open,
  onOpenChange,
  editingPrompt,
  formData,
  setFormData,
  categories,
  onSave,
}: SystemPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            {editingPrompt ? 'Edit System Prompt' : 'Create System Prompt'}
          </DialogTitle>
          <DialogDescription>
            {editingPrompt
              ? 'Update the system prompt configuration and content.'
              : 'Create a new system prompt for AI generation features.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter prompt name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-600">
                  No categories available. Please create a category first in the Categories tab.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter prompt description"
            />
          </div>

          <div className="space-y-2">
            <Label>Content *</Label>
            <TiptapEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Enter the system prompt content..."
              className="min-h-[300px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-input accent-primary"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!formData.name || !formData.categoryId || !formData.content}
          >
            <Save className="h-4 w-4 mr-2" />
            {editingPrompt ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
