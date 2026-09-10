"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { Category, CategoryFormData, CategoryItemFormData } from './CategoriesTreeTypes';

export function CategoryFormFields({
  formData,
  categoryTitle,
  onChange,
  idPrefix,
}: {
  formData: CategoryFormData;
  categoryTitle: string;
  onChange: (formData: CategoryFormData) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
          placeholder={`e.g., ${categoryTitle}`}
        />
      </div>
    </div>
  );
}

export function CategoryItemFormFields({
  formData,
  categories,
  onChange,
  idPrefix,
}: {
  formData: CategoryItemFormData;
  categories: Category[];
  onChange: (formData: CategoryItemFormData) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => onChange({ ...formData, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
