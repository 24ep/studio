"use client";

import type { ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type {
  BaseGroup,
  BaseItemFormData,
} from './BaseGroupsAndItemsTypes';
import {
  getBaseItemGroupCopy,
  parseBaseItemMaxScore,
} from './base-groups-and-items-utils';

export function BaseItemFormFields({
  formData,
  onChange,
  itemTitle,
  groups,
  showSkillFields,
  previewUrl,
  onFileSelect,
  onRemoveFile,
  idPrefix,
}: {
  formData: BaseItemFormData;
  onChange: (data: BaseItemFormData) => void;
  itemTitle: string;
  groups: BaseGroup[];
  showSkillFields: boolean;
  previewUrl: string;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  idPrefix: string;
}) {
  const { groupLabel, groupPlaceholder, noGroupLabel } = getBaseItemGroupCopy(itemTitle);

  return (
    <div className="space-y-4">
      <BaseItemTextFields
        formData={formData}
        idPrefix={idPrefix}
        onChange={onChange}
      />
      <BaseItemIconField
        idPrefix={idPrefix}
        onFileSelect={onFileSelect}
        onRemoveFile={onRemoveFile}
        previewUrl={previewUrl}
      />
      {showSkillFields && (
        <BaseItemSkillFields
          formData={formData}
          idPrefix={idPrefix}
          onChange={onChange}
        />
      )}
      <BaseItemGroupSelect
        formData={formData}
        groupLabel={groupLabel}
        groupPlaceholder={groupPlaceholder}
        groups={groups}
        idPrefix={idPrefix}
        noGroupLabel={noGroupLabel}
        onChange={onChange}
      />
    </div>
  );
}

function BaseItemTextFields({
  formData,
  idPrefix,
  onChange,
}: {
  formData: BaseItemFormData;
  idPrefix: string;
  onChange: (data: BaseItemFormData) => void;
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => onChange({ ...formData, name: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(event) => onChange({ ...formData, description: event.target.value })}
        />
      </div>
    </>
  );
}

function BaseItemIconField({
  idPrefix,
  onFileSelect,
  onRemoveFile,
  previewUrl,
}: {
  idPrefix: string;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  previewUrl: string;
}) {
  return (
    <div>
      <Label htmlFor={`${idPrefix}-icon`}>Icon</Label>
      <div className="space-y-2">
        <Input
          id={`${idPrefix}-icon`}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
        />
        {previewUrl && (
          <div className="flex items-center gap-2">
            <img
              src={previewUrl}
              alt="Icon preview"
              className="w-8 h-8 rounded object-cover"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemoveFile}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function BaseItemSkillFields({
  formData,
  idPrefix,
  onChange,
}: {
  formData: BaseItemFormData;
  idPrefix: string;
  onChange: (data: BaseItemFormData) => void;
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-skill-type`}>Skill Type</Label>
        <Select
          value={formData.skillType}
          onValueChange={(value) => onChange({ ...formData, skillType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hard_skill">Hard Skill</SelectItem>
            <SelectItem value="test_score">Test Score</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-max-score`}>Max Score</Label>
        <Input
          id={`${idPrefix}-max-score`}
          type="number"
          min="1"
          max="1000"
          value={formData.maxScore}
          onChange={(event) => onChange({ ...formData, maxScore: parseBaseItemMaxScore(event.target.value) })}
        />
      </div>
    </>
  );
}

function BaseItemGroupSelect({
  formData,
  groupLabel,
  groupPlaceholder,
  groups,
  idPrefix,
  noGroupLabel,
  onChange,
}: {
  formData: BaseItemFormData;
  groupLabel: string;
  groupPlaceholder: string;
  groups: BaseGroup[];
  idPrefix: string;
  noGroupLabel: string;
  onChange: (data: BaseItemFormData) => void;
}) {
  return (
    <div>
      <Label htmlFor={`${idPrefix}-group`}>{groupLabel}</Label>
      <Select
        value={formData.groupId}
        onValueChange={(value) => onChange({ ...formData, groupId: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder={groupPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{noGroupLabel}</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
