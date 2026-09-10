import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  SkillTemplateSelectionGroup,
  SkillTemplateSelectionItem,
  SkillTemplateSelectionPopoverProps,
} from "./SkillTemplateSelectionPopoverTypes";

type ItemIconType = SkillTemplateSelectionPopoverProps["ItemIcon"];

function SelectAllInlineButton({ onSelectAll }: { onSelectAll: () => void }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:text-primary">
      <span
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelectAll();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        Select All
      </span>
    </Button>
  );
}

export function SkillTemplateGroupRow({
  group,
  groupedItemCountLabel,
  groupItems,
  ItemIcon,
  onGroupToggle,
  onItemToggle,
  popoverId,
  selectedGroupIds,
  selectedItemIds,
}: {
  group: SkillTemplateSelectionGroup;
  groupedItemCountLabel: string;
  groupItems: SkillTemplateSelectionItem[];
  ItemIcon: ItemIconType;
  onGroupToggle: (groupId: string) => void;
  onItemToggle: (itemId: string) => void;
  popoverId: string;
  selectedGroupIds: string[];
  selectedItemIds: string[];
}) {
  return (
    <div key={`${popoverId}-group-${group.id}`} className="px-2">
      <button
        type="button"
        className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
        onClick={() => onGroupToggle(group.id)}
      >
        <Check className={cn("h-4 w-4", selectedGroupIds.includes(group.id) ? "opacity-100" : "opacity-0")} />
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="font-medium">{group.name}</span>
            <span className="text-xs text-muted-foreground">({groupItems.length} {groupedItemCountLabel})</span>
          </div>
          <SelectAllInlineButton onSelectAll={() => onGroupToggle(group.id)} />
        </div>
      </button>
      {groupItems.map((item) => (
        <SkillTemplateItemRow
          key={`${popoverId}-item-${item.id}`}
          item={item}
          ItemIcon={ItemIcon}
          onItemToggle={onItemToggle}
          selectedItemIds={selectedItemIds}
          className="ml-6"
        />
      ))}
    </div>
  );
}

export function SkillTemplateIndividualSection({
  individualSelectAllLabel,
  ItemIcon,
  onItemToggle,
  onSelectAllIndividualItems,
  popoverId,
  selectedItemIds,
  soloItems,
}: {
  individualSelectAllLabel: string;
  ItemIcon: ItemIconType;
  onItemToggle: (itemId: string) => void;
  onSelectAllIndividualItems: () => void;
  popoverId: string;
  selectedItemIds: string[];
  soloItems: SkillTemplateSelectionItem[];
}) {
  return (
    <div className="px-2">
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
        onClick={onSelectAllIndividualItems}
      >
        <span className="flex items-center gap-2">
          <ItemIcon className="h-4 w-4 text-primary" />
          {individualSelectAllLabel}
        </span>
        <SelectAllInlineButton onSelectAll={onSelectAllIndividualItems} />
      </button>
      {soloItems.map((item) => (
        <SkillTemplateItemRow
          key={`${popoverId}-item-solo-${item.id}`}
          item={item}
          ItemIcon={ItemIcon}
          onItemToggle={onItemToggle}
          selectedItemIds={selectedItemIds}
        />
      ))}
    </div>
  );
}

function SkillTemplateItemRow({
  className,
  item,
  ItemIcon,
  onItemToggle,
  selectedItemIds,
}: {
  className?: string;
  item: SkillTemplateSelectionItem;
  ItemIcon: ItemIconType;
  onItemToggle: (itemId: string) => void;
  selectedItemIds: string[];
}) {
  return (
    <button
      type="button"
      className={cn("w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground", className)}
      onClick={() => onItemToggle(item.id)}
    >
      <Check className={cn("h-4 w-4", selectedItemIds.includes(item.id) ? "opacity-100" : "opacity-0")} />
      <ItemIcon className="h-4 w-4 text-muted-foreground" />
      {item.name}
    </button>
  );
}
