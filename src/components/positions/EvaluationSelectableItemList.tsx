"use client";

import type { ReactNode } from "react";
import { CheckCircle, Circle, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EvaluationSelectableItem {
  id: string;
  name: string;
  description?: string | null;
  groupId?: string | null;
}

export interface EvaluationSelectableGroup {
  id: string;
  name: string;
  color?: string | null;
}

interface SelectedEvaluationItem {
  id: string;
  name: string;
}

interface EvaluationSelectableItemListProps<TItem extends EvaluationSelectableItem> {
  selectedItems: SelectedEvaluationItem[];
  groups: EvaluationSelectableGroup[];
  filteredItems: TItem[];
  templateItemIds: string[];
  searchTerm: string;
  emptyItemName: string;
  ungroupedTitle: string;
  onRemoveSelectedItem: (itemId: string) => void;
  onToggleItem: (itemId: string) => void;
  onToggleGroup: (groupId: string | "ungrouped") => void;
  renderItemMeta?: (item: TItem) => ReactNode;
}

function handleKeyboardClick(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
}

export function EvaluationSelectableItemList<TItem extends EvaluationSelectableItem>({
  selectedItems,
  groups,
  filteredItems,
  templateItemIds,
  searchTerm,
  emptyItemName,
  ungroupedTitle,
  onRemoveSelectedItem,
  onToggleItem,
  onToggleGroup,
  renderItemMeta,
}: EvaluationSelectableItemListProps<TItem>) {
  const selectedIds = new Set(selectedItems.map(item => item.id));
  const templateIds = new Set(templateItemIds);
  const sections: ReactNode[] = [];

  const renderItem = (item: TItem) => {
    const inTemplate = templateIds.has(item.id);
    const isSelected = selectedIds.has(item.id);

    return (
      <div
        key={item.id}
        className={cn(
          "p-3 cursor-pointer hover:bg-muted/50 border-t first:border-t-0",
          isSelected && "bg-primary/10 border-primary/20",
        )}
        onClick={() => onToggleItem(item.id)}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyboardClick}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {isSelected ? (
              <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
            )}
            <div className={cn("flex flex-col", inTemplate && "opacity-60")}>
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">{item.description || "No description"}</span>
              {renderItemMeta?.(item)}
            </div>
          </div>
          {inTemplate && (
            <Badge variant="outline" className="h-5 text-[10px] mt-0.5">already add on template</Badge>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (
    key: string,
    title: string,
    items: TItem[],
    groupId: string | "ungrouped",
    color?: string | null,
  ) => {
    const allSelected = items.every(item => selectedIds.has(item.id));

    return (
      <div key={key} className="border-b last:border-b-0">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40">
          <div className="flex items-center gap-2">
            {color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />}
            <span className="text-sm font-medium">{title}</span>
            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onToggleGroup(groupId)}>
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <div>{items.map(renderItem)}</div>
      </div>
    );
  };

  groups.forEach(group => {
    const groupItems = filteredItems.filter(item => item.groupId === group.id);
    if (groupItems.length === 0) return;
    sections.push(renderSection(`group-${group.id}`, group.name, groupItems, group.id, group.color));
  });

  const ungroupedItems = filteredItems.filter(item => !item.groupId);
  if (ungroupedItems.length > 0) {
    sections.push(renderSection("group-ungrouped", ungroupedTitle, ungroupedItems, "ungrouped"));
  }

  return (
    <>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map(item => (
            <Badge key={item.id} variant="secondary" className="flex items-center gap-1">
              {item.name}
              <button type="button" onClick={() => onRemoveSelectedItem(item.id)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="border rounded-md max-h-[60vh] overflow-y-auto">
        {sections.length > 0 ? (
          sections
        ) : (
          <div className="p-3 text-muted-foreground text-center">
            No {emptyItemName} found matching "{searchTerm}"
          </div>
        )}
      </div>
    </>
  );
}
