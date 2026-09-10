import type { BaseGroupsAndItemsTabProps } from './BaseGroupsAndItemsParts';
import type { useBaseGroupsAndItemsController } from './use-base-groups-and-items-controller';

export type BaseGroupsAndItemsController = ReturnType<typeof useBaseGroupsAndItemsController>;

export type BaseGroupsAndItemsSharedProps = Pick<
  BaseGroupsAndItemsTabProps,
  'groupTitle' | 'itemTitle' | 'showSkillFields' | 'showGroupDetailsModal' | 'onGroupDetails'
> & {
  controller: BaseGroupsAndItemsController;
  modalZIndex: number;
};
