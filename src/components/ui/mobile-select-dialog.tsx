"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MobileSelectItem } from "./mobile-select-utils";

interface MobileSelectDialogProps {
  contentZIndex: number;
  disabled?: boolean;
  items: MobileSelectItem[];
  onValueChange?: (value: string) => void;
  placeholder?: string;
  selectId?: string;
  selectedItem: MobileSelectItem | undefined;
  value?: string;
}

export function MobileSelectDialog({
  contentZIndex,
  disabled,
  items,
  onValueChange,
  placeholder,
  selectId,
  selectedItem,
  value,
}: MobileSelectDialogProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-8 w-full justify-between !rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-normal text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onClick={() => !disabled && setIsModalOpen(true)}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedItem ? selectedItem.label : placeholder || "Select option..."}
        </span>
        <ChevronDownIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-full w-full h-full max-h-screen p-0 m-0 rounded-none flex flex-col fixed inset-0 translate-x-0 translate-y-0"
          dialogId={`mobile-select-modal-${selectId || "default"}`}
          style={{ zIndex: contentZIndex + 100 }}
        >
          <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0 border-b">
            <DialogTitle>{placeholder || "Select option"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-1">
              {items.map((item) => {
                const isSelected = value === item.value;
                return (
                  <Button
                    key={item.value}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto py-4 px-4 text-left font-normal text-base",
                      "hover:bg-accent",
                      isSelected && "bg-accent",
                      item.disabled && "opacity-50 cursor-not-allowed",
                    )}
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled && onValueChange) {
                        onValueChange(item.value);
                        setIsModalOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">{item.label}</div>
                      {isSelected && (
                        <CheckIcon className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
