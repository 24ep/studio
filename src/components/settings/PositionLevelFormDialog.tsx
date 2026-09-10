"use client";

import type { FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { ColorPicker } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { PositionLevel } from '@/lib/types';

import type { PositionLevelFormData } from './position-levels-types';

interface PositionLevelFormDialogProps {
  editingLevel: PositionLevel | null;
  formData: PositionLevelFormData;
  isSubmitting: boolean;
  onClose: () => void;
  onFormDataChange: (data: PositionLevelFormData) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
}

export function PositionLevelFormDialog({
  editingLevel,
  formData,
  isSubmitting,
  onClose,
  onFormDataChange,
  onOpenChange,
  onSubmit,
  open,
}: PositionLevelFormDialogProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingLevel ? 'Edit Position Level' : 'Add New Position Level'}</DialogTitle>
          <DialogDescription>Define a standardized position level.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => onFormDataChange({ ...formData, name: event.target.value })}
              placeholder="e.g., Senior level"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => onFormDataChange({ ...formData, description: event.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <ColorPicker
              value={formData.color || '#6B7280'}
              onChange={(color) => onFormDataChange({ ...formData, color })}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLevel ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
