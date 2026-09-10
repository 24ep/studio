import { useCallback, useState, type ChangeEvent } from 'react';

import {
  buildBaseItemFormState,
} from './base-groups-and-items-utils';
import type {
  BaseGroup,
  BaseItem,
} from './BaseGroupsAndItemsParts';

interface UseBaseGroupsAndItemsDialogStateInput {
  selectedGroupId: string;
  showSkillFields: boolean;
}

export function useBaseGroupsAndItemsDialogState({
  selectedGroupId,
  showSkillFields,
}: UseBaseGroupsAndItemsDialogStateInput) {
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isCreateItemDialogOpen, setIsCreateItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [isGroupDetailsDialogOpen, setIsGroupDetailsDialogOpen] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<BaseGroup | null>(null);
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
  });
  const [itemFormData, setItemFormData] = useState(() => buildBaseItemFormState(showSkillFields));

  const resetGroupDialogState = useCallback(() => {
    setSelectedGroup(null);
    setGroupFormData({ name: '', description: '' });
  }, []);

  const resetItemDialogState = useCallback(() => {
    setSelectedItem(null);
    setItemFormData(buildBaseItemFormState(showSkillFields));
    setPreviewUrl('');
  }, [showSkillFields]);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setItemFormData(previous => ({ ...previous, iconUrl: url }));
  }, []);

  const handleRemoveFile = useCallback(() => {
    setPreviewUrl(previous => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return '';
    });
    setItemFormData(previous => ({ ...previous, iconUrl: '' }));
  }, []);

  const openEditGroupDialog = useCallback((group: BaseGroup) => {
    setSelectedGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
    });
    setIsEditGroupDialogOpen(true);
  }, []);

  const openEditItemDialog = useCallback((item: BaseItem) => {
    setSelectedItem(item);
    setItemFormData(buildBaseItemFormState(showSkillFields, {
      name: item.name,
      description: item.description || '',
      groupId: item.groupId || '',
      iconUrl: item.iconUrl || '',
      maxScore: item.maxScore || 100,
      skillType: item.skillType || 'hard_skill',
    }));
    setPreviewUrl(item.iconUrl || '');
    setIsEditItemDialogOpen(true);
  }, [showSkillFields]);

  const openCreateItemDialog = useCallback((name = '') => {
    setItemSearchOpen(false);
    setItemSearchValue('');
    setPreviewUrl('');
    setItemFormData(buildBaseItemFormState(showSkillFields, {
      name,
      groupId: selectedGroupId === 'all' ? 'none' : selectedGroupId,
    }));
    setIsCreateItemDialogOpen(true);
  }, [selectedGroupId, showSkillFields]);

  const openGroupDetailsDialog = useCallback((group: BaseGroup) => {
    setSelectedGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
    });
    setIsGroupDetailsDialogOpen(true);
  }, []);

  return {
    groupFormData,
    handleFileSelect,
    handleRemoveFile,
    isCreateGroupDialogOpen,
    isCreateItemDialogOpen,
    isEditGroupDialogOpen,
    isEditItemDialogOpen,
    isGroupDetailsDialogOpen,
    itemFormData,
    itemSearchOpen,
    itemSearchValue,
    openCreateItemDialog,
    openEditGroupDialog,
    openEditItemDialog,
    openGroupDetailsDialog,
    previewUrl,
    resetGroupDialogState,
    resetItemDialogState,
    selectedGroup,
    selectedItem,
    setGroupFormData,
    setIsCreateGroupDialogOpen,
    setIsCreateItemDialogOpen,
    setIsEditGroupDialogOpen,
    setIsEditItemDialogOpen,
    setIsGroupDetailsDialogOpen,
    setItemFormData,
    setItemSearchOpen,
    setItemSearchValue,
    setPreviewUrl,
    setSelectedGroup,
    setSelectedItem,
  };
}
