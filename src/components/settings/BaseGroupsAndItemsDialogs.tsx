"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BaseGroupFormFields,
  BaseItemFormFields,
  type BaseGroup,
  type BaseGroupFormData,
  type BaseItem,
  type BaseItemFormData,
} from './BaseGroupsAndItemsParts';
import { BaseGroupDetailsTabs } from './BaseGroupsAndItemsDialogParts';
import { getItemsForGroupDetails } from './base-groups-and-items-utils';

export function BaseGroupDialog({
  open,
  mode,
  groupTitle,
  itemTitle,
  formData,
  trigger,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  groupTitle: string;
  itemTitle: string;
  formData: BaseGroupFormData;
  trigger?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: BaseGroupFormData) => void;
  onSubmit: () => void;
}) {
  const isCreate = mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create' : 'Edit'} {groupTitle}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? `Create a new group to organize related ${itemTitle.toLowerCase()}`
              : `Update the ${groupTitle.toLowerCase()} details`}
          </DialogDescription>
        </DialogHeader>
        <BaseGroupFormFields
          formData={formData}
          groupTitle={groupTitle}
          onChange={onFormDataChange}
          idPrefix={`${mode}-group`}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isCreate ? 'Create' : 'Update'} Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BaseItemDialog({
  open,
  mode,
  itemTitle,
  groups,
  formData,
  showSkillFields,
  previewUrl,
  onOpenChange,
  onFormDataChange,
  onFileSelect,
  onRemoveFile,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  itemTitle: string;
  groups: BaseGroup[];
  formData: BaseItemFormData;
  showSkillFields: boolean;
  previewUrl: string;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: BaseItemFormData) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSubmit: () => void;
}) {
  const isCreate = mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create' : 'Edit'} {itemTitle}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? `Create a new ${itemTitle.toLowerCase()} with all the necessary details`
              : `Update the ${itemTitle.toLowerCase()} details`}
          </DialogDescription>
        </DialogHeader>
        <BaseItemFormFields
          formData={formData}
          onChange={onFormDataChange}
          itemTitle={itemTitle}
          groups={groups}
          showSkillFields={showSkillFields}
          previewUrl={previewUrl}
          onFileSelect={onFileSelect}
          onRemoveFile={onRemoveFile}
          idPrefix={`${mode}-item`}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {isCreate ? 'Create' : 'Update'} {itemTitle.slice(0, -1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BaseGroupDetailsDialog({
  open,
  groupTitle,
  selectedGroup,
  items,
  groupFormData,
  showSkillFields,
  onOpenChange,
  onGroupFormDataChange,
  onSave,
}: {
  open: boolean;
  groupTitle: string;
  selectedGroup: BaseGroup | null;
  items: BaseItem[];
  groupFormData: BaseGroupFormData;
  showSkillFields: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupFormDataChange: (data: BaseGroupFormData) => void;
  onSave: () => void;
}) {
  const selectedGroupItems = getItemsForGroupDetails(items, selectedGroup);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{selectedGroup?.name} - Group Details</DialogTitle>
          <DialogDescription>
            Manage group details, skills, position assignments, and activity logs
          </DialogDescription>
        </DialogHeader>
        <BaseGroupDetailsTabs
          groupFormData={groupFormData}
          groupTitle={groupTitle}
          items={selectedGroupItems}
          showSkillFields={showSkillFields}
          onCancel={() => onOpenChange(false)}
          onGroupFormDataChange={onGroupFormDataChange}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
