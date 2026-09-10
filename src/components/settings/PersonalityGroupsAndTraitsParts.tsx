"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';

export { PersonalityAddTraitPopover } from './PersonalityAddTraitPopover';

export interface PersonalityGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  isActive: boolean;
  sortOrder: number;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface PersonalityGroupFormData {
  name: string;
  description: string;
  color: string;
}

export interface PersonalityTraitFormData {
  name: string;
  description: string;
  shortDescription: string;
  groupId: string;
}

export function PersonalityGroupFormFields({
  formData,
  onChange,
  idPrefix,
}: {
  formData: PersonalityGroupFormData;
  onChange: (formData: PersonalityGroupFormData) => void;
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
          placeholder="e.g., Communication Skills"
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
      <div>
        <Label htmlFor={`${idPrefix}-color`}>Color</Label>
        <ColorPicker
          value={formData.color || '#3B82F6'}
          onChange={(color) => onChange({ ...formData, color })}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function PersonalityTraitFormFields({
  formData,
  groups,
  onChange,
  idPrefix,
}: {
  formData: PersonalityTraitFormData;
  groups: PersonalityGroup[];
  onChange: (formData: PersonalityTraitFormData) => void;
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
          placeholder="e.g., Leadership"
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
      <div>
        <Label htmlFor={`${idPrefix}-shortDescription`}>Short Description</Label>
        <Input
          id={`${idPrefix}-shortDescription`}
          value={formData.shortDescription}
          onChange={(event) => onChange({ ...formData, shortDescription: event.target.value })}
          placeholder="Optional short description (shown in navigation)"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-group`}>Category</Label>
        <Select
          value={formData.groupId}
          onValueChange={(value) => onChange({ ...formData, groupId: value })}
        >
          <SelectTrigger id={`${idPrefix}-group`}>
            <SelectValue placeholder="Select a category (optional)" />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            <SelectItem value="">No Category</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
