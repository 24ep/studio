"use client";

import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { TreeCategorySelect, type TreeCategoryOption } from "./TreeCategorySelect";
import { TreeItemIconFields } from "./TreeItemIconFields";
import { TreeScoreLabelsConfig } from "./TreeScoreLabelsConfig";
import type { TreeItemFormData } from "./tree-view-utils";

interface TreeItemFormFieldsProps {
  idPrefix: string;
  formData: TreeItemFormData;
  categories: TreeCategoryOption[];
  categoryEmptyMessage: string;
  isPersonalityTraits: boolean;
  showAdvancedConfig: boolean;
  iconFile: File | null;
  iconPreview: string | null;
  showSkillType?: boolean;
  validateSelectedCategory?: boolean;
  onFormDataChange: (formData: TreeItemFormData) => void;
  onAdvancedConfigOpenChange: (open: boolean) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveIcon: () => void;
}

export function TreeItemFormFields({
  idPrefix,
  formData,
  categories,
  categoryEmptyMessage,
  isPersonalityTraits,
  showAdvancedConfig,
  iconFile,
  iconPreview,
  showSkillType = false,
  validateSelectedCategory = false,
  onFormDataChange,
  onAdvancedConfigOpenChange,
  onFileUpload,
  onRemoveIcon,
}: TreeItemFormFieldsProps) {
  const updateFormData = (patch: Partial<TreeItemFormData>) => {
    onFormDataChange({ ...formData, ...patch });
  };

  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(event) => updateFormData({ name: event.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(event) => updateFormData({ description: event.target.value })}
          placeholder="Optional description"
        />
      </div>
      {isPersonalityTraits && (
        <div>
          <Label htmlFor={`${idPrefix}-shortDescription`}>Short Description</Label>
          <Input
            id={`${idPrefix}-shortDescription`}
            value={formData.shortDescription}
            onChange={(event) => updateFormData({ shortDescription: event.target.value })}
            placeholder="Optional short description (shown in navigation)"
          />
        </div>
      )}
      {!isPersonalityTraits && showSkillType && (
        <div>
          <Label htmlFor={`${idPrefix}-skill-type`}>Skill Type</Label>
          <Select
            value={formData.skillType}
            onValueChange={(value) => updateFormData({ skillType: value as "hard_skill" | "test_score" })}
          >
            <SelectTrigger id={`${idPrefix}-skill-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hard_skill">Hard Skill</SelectItem>
              <SelectItem value="test_score">Test Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {!isPersonalityTraits && (
        <div>
          <Label htmlFor={`${idPrefix}-max-score`}>Max Score</Label>
          <Input
            id={`${idPrefix}-max-score`}
            type="number"
            min="1"
            max="1000"
            value={formData.maxScore}
            onChange={(event) => updateFormData({ maxScore: parseInt(event.target.value) || 100 })}
          />
        </div>
      )}
      {isPersonalityTraits && (
        <TreeScoreLabelsConfig
          idPrefix={idPrefix}
          labels={formData.scoreLabels}
          open={showAdvancedConfig}
          onOpenChange={onAdvancedConfigOpenChange}
          onLabelsChange={(scoreLabels) => updateFormData({ scoreLabels })}
        />
      )}
      <TreeCategorySelect
        id={`${idPrefix}-category`}
        selectId={`${idPrefix}-category-select`}
        categoryId={formData.categoryId}
        categories={categories}
        emptyMessage={categoryEmptyMessage}
        validateSelectedCategory={validateSelectedCategory}
        onCategoryIdChange={(categoryId) => updateFormData({ categoryId })}
      />
      <TreeItemIconFields
        iconFile={iconFile}
        iconPreview={iconPreview}
        iconUrl={formData.iconUrl}
        idPrefix={idPrefix}
        onFileUpload={onFileUpload}
        onIconUrlChange={(iconUrl) => updateFormData({ iconUrl })}
        onRemoveIcon={onRemoveIcon}
      />
    </>
  );
}
