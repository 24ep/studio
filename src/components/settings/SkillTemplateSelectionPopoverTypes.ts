import type { ComponentType } from "react";

export interface SkillTemplateSelectionGroup {
  id: string;
  name: string;
  color: string;
}

export interface SkillTemplateSelectionItem {
  id: string;
  name: string;
  groupId?: string;
}

export interface SkillTemplateSelectionPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popoverId: string;
  containerEl?: HTMLElement | null;
  selectedGroupIds: string[];
  selectedItemIds: string[];
  groups: SkillTemplateSelectionGroup[];
  items: SkillTemplateSelectionItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  triggerPlaceholder: string;
  searchPlaceholder: string;
  groupSectionLabel: string;
  individualSectionLabel: string;
  individualSelectAllLabel: string;
  groupedItemCountLabel: string;
  ItemIcon: ComponentType<{ className?: string }>;
  onGroupToggle: (groupId: string) => void;
  onItemToggle: (itemId: string) => void;
  onSelectAllIndividualItems: () => void;
}
