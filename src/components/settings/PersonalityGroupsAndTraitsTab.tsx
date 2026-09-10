"use client";

import BaseGroupsAndItemsTab from './BaseGroupsAndItemsTab';

export default function PersonalityGroupsAndTraitsTab() {
  return (
    <BaseGroupsAndItemsTab
      title="Personality Groups & Traits"
      groupTitle="Personality Groups"
      itemTitle="Personality Traits"
      groupsEndpoint="/api/v1/evaluation/personality-groups"
      itemsEndpoint="/api/v1/evaluation/personality-traits"
      showSkillFields={false}
      showGroupDetailsModal={false}
    />
  );
}
