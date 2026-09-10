"use client";

import { useDynamicZIndex } from '@/contexts/ZIndexContext';

import type { BaseGroupsAndItemsTabProps } from './BaseGroupsAndItemsParts';
import { BaseGroupsAndItemsDialogStack } from './BaseGroupsAndItemsDialogStack';
import { BaseGroupsPanel } from './BaseGroupsPanel';
import { BaseItemsPanel } from './BaseItemsPanel';
import { useBaseGroupsAndItemsController } from './use-base-groups-and-items-controller';

export default function BaseGroupsAndItemsTab({
  groupTitle,
  itemTitle,
  groupsEndpoint,
  itemsEndpoint,
  showSkillFields = false,
  showGroupDetailsModal = false,
  onGroupDetails,
}: BaseGroupsAndItemsTabProps) {
  const { contentZIndex: modalZIndex } = useDynamicZIndex('groups-and-items-modals', 'modal');
  const controller = useBaseGroupsAndItemsController({
    groupTitle,
    itemTitle,
    groupsEndpoint,
    itemsEndpoint,
    showSkillFields,
  });

  if (controller.loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      <BaseGroupsPanel
        controller={controller}
        groupTitle={groupTitle}
        itemTitle={itemTitle}
        modalZIndex={modalZIndex}
        onGroupDetails={onGroupDetails}
        showGroupDetailsModal={showGroupDetailsModal}
        showSkillFields={showSkillFields}
      />

      <BaseItemsPanel
        controller={controller}
        groupTitle={groupTitle}
        itemTitle={itemTitle}
        modalZIndex={modalZIndex}
        showGroupDetailsModal={showGroupDetailsModal}
        showSkillFields={showSkillFields}
      />

      <BaseGroupsAndItemsDialogStack
        controller={controller}
        groupTitle={groupTitle}
        itemTitle={itemTitle}
        showGroupDetailsModal={showGroupDetailsModal}
        showSkillFields={showSkillFields}
      />
    </div>
  );
}
