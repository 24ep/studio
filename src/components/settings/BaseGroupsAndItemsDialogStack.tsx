"use client";

import {
  BaseGroupDetailsDialog,
  BaseGroupDialog,
  BaseItemDialog,
} from './BaseGroupsAndItemsDialogs';
import type { BaseGroupsAndItemsSharedProps } from './BaseGroupsAndItemsTabTypes';

export function BaseGroupsAndItemsDialogStack({
  controller,
  groupTitle,
  itemTitle,
  showGroupDetailsModal = false,
  showSkillFields = false,
}: Omit<BaseGroupsAndItemsSharedProps, 'modalZIndex' | 'onGroupDetails'>) {
  return (
    <>
      <BaseGroupDialog
        open={controller.isEditGroupDialogOpen}
        mode="edit"
        groupTitle={groupTitle}
        itemTitle={itemTitle}
        formData={controller.groupFormData}
        onOpenChange={controller.setIsEditGroupDialogOpen}
        onFormDataChange={controller.setGroupFormData}
        onSubmit={controller.handleUpdateGroup}
      />

      <BaseItemDialog
        open={controller.isCreateItemDialogOpen}
        mode="create"
        itemTitle={itemTitle}
        groups={controller.groups}
        formData={controller.itemFormData}
        showSkillFields={showSkillFields}
        previewUrl={controller.previewUrl}
        onOpenChange={controller.setIsCreateItemDialogOpen}
        onFormDataChange={controller.setItemFormData}
        onFileSelect={controller.handleFileSelect}
        onRemoveFile={controller.handleRemoveFile}
        onSubmit={controller.handleCreateItem}
      />

      <BaseItemDialog
        open={controller.isEditItemDialogOpen}
        mode="edit"
        itemTitle={itemTitle}
        groups={controller.groups}
        formData={controller.itemFormData}
        showSkillFields={showSkillFields}
        previewUrl={controller.previewUrl}
        onOpenChange={controller.setIsEditItemDialogOpen}
        onFormDataChange={controller.setItemFormData}
        onFileSelect={controller.handleFileSelect}
        onRemoveFile={controller.handleRemoveFile}
        onSubmit={controller.handleUpdateItem}
      />

      {showGroupDetailsModal && (
        <BaseGroupDetailsDialog
          open={controller.isGroupDetailsDialogOpen}
          groupTitle={groupTitle}
          selectedGroup={controller.selectedGroup}
          items={controller.items}
          groupFormData={controller.groupFormData}
          showSkillFields={showSkillFields}
          onOpenChange={controller.setIsGroupDetailsDialogOpen}
          onGroupFormDataChange={controller.setGroupFormData}
          onSave={controller.handleUpdateGroup}
        />
      )}
    </>
  );
}
