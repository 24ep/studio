"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { BaseGroupFormData } from './BaseGroupsAndItemsTypes';

export function BaseGroupFormFields({
  formData,
  groupTitle,
  onChange,
  idPrefix,
}: {
  formData: BaseGroupFormData;
  groupTitle: string;
  onChange: (data: BaseGroupFormData) => void;
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
          placeholder={`e.g., ${groupTitle}`}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(event) => onChange({ ...formData, description: event.target.value })}
          placeholder="Optional description"
        />
      </div>
    </div>
  );
}
