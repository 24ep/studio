import { Brain, Heart } from "lucide-react";

import { SkillTemplateSelectionPopover } from "./SkillTemplateSelectionPopover";
import type { useSkillTemplatesTab } from "./use-skill-templates-tab";

type SkillTemplatesTabController = ReturnType<typeof useSkillTemplatesTab>;

export function renderExpertiseTemplatePopover(
  tab: SkillTemplatesTabController,
  isOpen: boolean,
  setOpen: (value: boolean) => void,
  popoverId: string,
  containerEl?: HTMLElement | null,
) {
  return (
    <SkillTemplateSelectionPopover
      open={isOpen}
      onOpenChange={setOpen}
      popoverId={popoverId}
      containerEl={containerEl}
      selectedGroupIds={tab.templateFormData.groupIds}
      selectedItemIds={tab.templateFormData.skillIds}
      groups={tab.groups}
      items={tab.skills}
      searchValue={tab.expertiseSearch}
      onSearchChange={tab.setExpertiseSearch}
      triggerPlaceholder="Select expertise groups and skills..."
      searchPlaceholder="Search expertise groups and skills..."
      groupSectionLabel="Expertise Groups"
      individualSectionLabel="Individual Skills"
      individualSelectAllLabel="Select All Individual Skills"
      groupedItemCountLabel="skills"
      ItemIcon={Brain}
      onGroupToggle={tab.handleGroupToggle}
      onItemToggle={tab.handleSkillToggle}
      onSelectAllIndividualItems={tab.handleSelectAllExpertiseSkills}
    />
  );
}

export function renderPersonalityTemplatePopover(
  tab: SkillTemplatesTabController,
  isOpen: boolean,
  setOpen: (value: boolean) => void,
  popoverId: string,
  containerEl?: HTMLElement | null,
) {
  return (
    <SkillTemplateSelectionPopover
      open={isOpen}
      onOpenChange={setOpen}
      popoverId={popoverId}
      containerEl={containerEl}
      selectedGroupIds={tab.templateFormData.personalityGroupIds}
      selectedItemIds={tab.templateFormData.personalityTraitIds}
      groups={tab.personalityGroups}
      items={tab.personalityTraits}
      searchValue={tab.personalitySearch}
      onSearchChange={tab.setPersonalitySearch}
      triggerPlaceholder="Select personality groups and traits..."
      searchPlaceholder="Search personality groups and traits..."
      groupSectionLabel="Personality Groups"
      individualSectionLabel="Individual Personality Traits"
      individualSelectAllLabel="Select All Individual Traits"
      groupedItemCountLabel="traits"
      ItemIcon={Heart}
      onGroupToggle={tab.handlePersonalityGroupToggle}
      onItemToggle={tab.handlePersonalityTraitToggle}
      onSelectAllIndividualItems={tab.handleSelectAllPersonalityTraits}
    />
  );
}
