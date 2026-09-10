"use client";

import type { ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  EvaluationSelectableItemList,
  type EvaluationSelectableGroup,
  type EvaluationSelectableItem,
} from "./EvaluationSelectableItemList";
import { EvaluationSearchInput } from "./EvaluationConfigControls";

interface AddEvaluationItemsSheetProps<TItem extends EvaluationSelectableItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  sheetId: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearchTermChange: (searchTerm: string) => void;
  selectedItems: Array<{ id: string; name: string }>;
  groups: EvaluationSelectableGroup[];
  filteredItems: TItem[];
  templateItemIds: string[];
  emptyItemName: string;
  ungroupedTitle: string;
  itemSingular: string;
  isAdding: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onRemoveSelectedItem: (itemId: string) => void;
  onToggleItem: (itemId: string) => void;
  onToggleGroup: (groupId: string | "ungrouped") => void;
  renderItemMeta?: (item: TItem) => ReactNode;
}

export function AddEvaluationItemsSheet<TItem extends EvaluationSelectableItem>({
  open,
  onOpenChange,
  title,
  description,
  sheetId,
  searchPlaceholder,
  searchTerm,
  onSearchTermChange,
  selectedItems,
  groups,
  filteredItems,
  templateItemIds,
  emptyItemName,
  ungroupedTitle,
  itemSingular,
  isAdding,
  onSubmit,
  onRemoveSelectedItem,
  onToggleItem,
  onToggleGroup,
  renderItemMeta,
}: AddEvaluationItemsSheetProps<TItem>) {
  const selectedCount = selectedItems.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add {itemSingular}
      </Button>
      <SheetContent side="right" className="w-[50vw] min-w-[800px] max-w-none p-0" sheetId={sheetId}>
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <EvaluationSearchInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={onSearchTermChange}
            />
            <EvaluationSelectableItemList
              selectedItems={selectedItems}
              groups={groups}
              filteredItems={filteredItems}
              templateItemIds={templateItemIds}
              searchTerm={searchTerm}
              emptyItemName={emptyItemName}
              ungroupedTitle={ungroupedTitle}
              onRemoveSelectedItem={onRemoveSelectedItem}
              onToggleItem={onToggleItem}
              onToggleGroup={onToggleGroup}
              renderItemMeta={renderItemMeta}
            />
          </div>
          <div className="mt-auto p-4 border-t flex justify-end gap-2">
            <Button onClick={onSubmit} disabled={selectedCount === 0 || isAdding}>
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add {selectedCount > 0 ? `${selectedCount} ` : ""}
              {itemSingular}
              {selectedCount > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
