"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TreeCategoryOption {
  id: string;
  name: string;
  color?: string | null;
}

interface TreeCategorySelectProps {
  id: string;
  selectId: string;
  categoryId: string;
  categories: TreeCategoryOption[];
  onCategoryIdChange: (categoryId: string) => void;
  emptyMessage: string;
  validateSelectedCategory?: boolean;
}

export function TreeCategorySelect({
  id,
  selectId,
  categoryId,
  categories,
  onCategoryIdChange,
  emptyMessage,
  validateSelectedCategory = false,
}: TreeCategorySelectProps) {
  const hasCategory = Boolean(categoryId) && categoryId !== "none";
  const selectedCategoryId = hasCategory && (!validateSelectedCategory || categories.some(category => category.id === categoryId))
    ? categoryId
    : "none";

  return (
    <div>
      <Label htmlFor={id}>Category</Label>
      <Select
        value={selectedCategoryId}
        onValueChange={(value) => onCategoryIdChange(value === "none" ? "none" : value)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select a category (optional)" />
        </SelectTrigger>
        <SelectContent
          selectId={selectId}
          className="w-[var(--radix-select-trigger-width)]"
        >
          <SelectItem value="none">No Category</SelectItem>
          {categories.length > 0 ? (
            categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  {category.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  {category.name}
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>{emptyMessage}</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
