export interface BaseGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BaseItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: {
    id: string;
    name: string;
  };
  maxScore?: number;
  skillType?: string;
  iconUrl?: string;
}

export interface BaseGroupsAndItemsTabProps {
  title: string;
  groupTitle: string;
  itemTitle: string;
  groupsEndpoint: string;
  itemsEndpoint: string;
  showSkillFields?: boolean;
  showGroupDetailsModal?: boolean;
  onGroupDetails?: (group: BaseGroup) => void;
}

export interface BaseItemFormData {
  name: string;
  description: string;
  groupId: string;
  iconUrl: string;
  maxScore?: number;
  skillType?: string;
}

export interface BaseGroupFormData {
  name: string;
  description: string;
}
