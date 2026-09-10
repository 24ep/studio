"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  SkillTemplateGroupRow,
  SkillTemplateIndividualSection,
} from "./SkillTemplateSelectionPopoverRows";
export type {
  SkillTemplateSelectionGroup,
  SkillTemplateSelectionItem,
} from "./SkillTemplateSelectionPopoverTypes";
import type { SkillTemplateSelectionPopoverProps } from "./SkillTemplateSelectionPopoverTypes";

export function SkillTemplateSelectionPopover({
  open,
  onOpenChange,
  popoverId,
  containerEl,
  selectedGroupIds,
  selectedItemIds,
  groups,
  items,
  searchValue,
  onSearchChange,
  triggerPlaceholder,
  searchPlaceholder,
  groupSectionLabel,
  individualSectionLabel,
  individualSelectAllLabel,
  groupedItemCountLabel,
  ItemIcon,
  onGroupToggle,
  onItemToggle,
  onSelectAllIndividualItems,
}: SkillTemplateSelectionPopoverProps) {
  const selectedCount = selectedGroupIds.length + selectedItemIds.length;
  const normalizedSearch = searchValue.toLowerCase();
  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(normalizedSearch));
  const getFilteredGroupItems = (groupId: string) => (
    items.filter((item) => item.groupId === groupId && item.name.toLowerCase().includes(normalizedSearch))
  );
  const soloItems = items.filter((item) => !item.groupId && item.name.toLowerCase().includes(normalizedSearch));

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mt-2"
        >
          {selectedCount > 0 ? `${selectedCount} items selected` : triggerPlaceholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        popoverId={popoverId}
        zIndexType="modal"
        align="start"
        side="bottom"
        sideOffset={4}
        container={containerEl || undefined}
      >
        <div className="p-2 max-h-[400px]">
          <div className="flex items-center border-b border-border px-2 pb-2">
            <input
              className="flex h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{groupSectionLabel}</div>
            {filteredGroups.map((group) => (
              <SkillTemplateGroupRow
                key={`${popoverId}-group-${group.id}`}
                group={group}
                groupedItemCountLabel={groupedItemCountLabel}
                groupItems={getFilteredGroupItems(group.id)}
                ItemIcon={ItemIcon}
                onGroupToggle={onGroupToggle}
                onItemToggle={onItemToggle}
                popoverId={popoverId}
                selectedGroupIds={selectedGroupIds}
                selectedItemIds={selectedItemIds}
              />
            ))}
            <div className="px-2 pt-2 text-xs font-medium text-muted-foreground">{individualSectionLabel}</div>
            <SkillTemplateIndividualSection
              individualSelectAllLabel={individualSelectAllLabel}
              ItemIcon={ItemIcon}
              onItemToggle={onItemToggle}
              onSelectAllIndividualItems={onSelectAllIndividualItems}
              popoverId={popoverId}
              selectedItemIds={selectedItemIds}
              soloItems={soloItems}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
