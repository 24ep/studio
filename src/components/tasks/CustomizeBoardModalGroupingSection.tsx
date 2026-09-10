import type React from 'react';
import { LayoutGrid, List } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BoardFieldOption } from './CustomizeBoardMultiSelect';
import { CustomizeBoardMultiSelect } from './CustomizeBoardMultiSelect';
import type { BoardGroupingSectionProps } from './CustomizeBoardModalTypes';
import { useLocalization } from '@/contexts/LocalizationContext';

export function BoardGroupingSection({
  columnField,
  disabled,
  getAllPossibleValues,
  getFieldLabel,
  rowAndColumnFields,
  rowField,
  setColumnField,
  setRowField,
  setVisibleColumnValues,
  setVisibleRowValues,
  visibleColumnValues,
  visibleRowValues,
}: BoardGroupingSectionProps) {
  const { t } = useLocalization();

  return (
    <div className="bg-muted/40 rounded-xl p-6 shadow-sm border flex flex-col gap-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
        <LayoutGrid className="w-5 h-5" /> {t("tasks.customizeBoard.groupingTitle", "Board Grouping")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GroupingField
          description={t(
            "tasks.customizeBoard.rowGroupingDescription",
            'Choose which attribute to group your board rows by. Select "None" to show all Applicants without row grouping.',
          )}
          disabled={disabled}
          field={rowField}
          fieldLabel={t("tasks.customizeBoard.rowAttribute", "Row Attribute")}
          getAllPossibleValues={getAllPossibleValues}
          getFieldLabel={getFieldLabel}
          icon={<List className="w-4 h-4" />}
          keyPrefix="row"
          onFieldChange={setRowField}
          onValuesChange={setVisibleRowValues}
          rowAndColumnFields={rowAndColumnFields}
          selectId="customize-board-row-select"
          selectedValues={visibleRowValues}
          valuesLabel={t("tasks.customizeBoard.rowValues", "Row Values")}
          localize={t}
        />
        <GroupingField
          description={t(
            "tasks.customizeBoard.columnGroupingDescription",
            'Choose which attribute to group your board columns by. Select "None" to show all Applicants without column grouping.',
          )}
          disabled={disabled}
          field={columnField}
          fieldLabel={t("tasks.customizeBoard.columnAttribute", "Column Attribute")}
          getAllPossibleValues={getAllPossibleValues}
          getFieldLabel={getFieldLabel}
          icon={<LayoutGrid className="w-4 h-4" />}
          keyPrefix="column"
          onFieldChange={setColumnField}
          onValuesChange={setVisibleColumnValues}
          rowAndColumnFields={rowAndColumnFields}
          selectId="customize-board-column-select"
          selectedValues={visibleColumnValues}
          valuesLabel={t("tasks.customizeBoard.columnValues", "Column Values")}
          localize={t}
        />
      </div>
    </div>
  );
}

interface GroupingFieldProps {
  description: string;
  disabled: boolean;
  field: string;
  fieldLabel: string;
  getAllPossibleValues: (fieldKey: string, fallbackFieldValues?: string[]) => string[];
  getFieldLabel: (key: string) => string;
  icon: React.ReactNode;
  keyPrefix: string;
  onFieldChange: (field: string) => void;
  onValuesChange: (values: string[]) => void;
  rowAndColumnFields: BoardFieldOption[];
  selectId: string;
  selectedValues: string[];
  valuesLabel: string;
  localize: (key: string, fallback: string) => string;
}

function GroupingField({
  description,
  disabled,
  field,
  fieldLabel,
  getAllPossibleValues,
  getFieldLabel,
  icon,
  keyPrefix,
  onFieldChange,
  onValuesChange,
  rowAndColumnFields,
  selectId,
  selectedValues,
  valuesLabel,
  localize,
}: GroupingFieldProps) {
  const selectFieldPlaceholder = localize(
    "tasks.customizeBoard.selectFieldPlaceholder",
    "Select {field} values to show...",
  ).replace("{field}", fieldLabel.toLowerCase());
  return (
    <div>
      <Label className="text-sm font-medium flex items-center gap-2 mb-2">
        {icon} {fieldLabel}
      </Label>
      <Select
        value={field || 'status'}
        onValueChange={onFieldChange}
        key={`${keyPrefix}-select-${rowAndColumnFields.length}`}
        disabled={disabled}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder={selectFieldPlaceholder} />
        </SelectTrigger>
        <SelectContent selectId={selectId}>
          {rowAndColumnFields.map((fieldOption) => (
            <SelectItem key={fieldOption.key} value={fieldOption.key} className="flex items-center gap-2">
              <span>{fieldOption.icon}</span>
              <span>{fieldOption.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>
      {field !== 'none' && (
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2">{valuesLabel}</Label>
          <CustomizeBoardMultiSelect
            options={getAllPossibleValues(field).map((value) => ({ key: value, label: value, icon: <List className="w-4 h-4" /> }))}
            selected={selectedValues}
            onChange={onValuesChange}
            placeholder={localize(
              "tasks.customizeBoard.selectValuesPlaceholder",
              "Select {field} values to show...",
            ).replace("{field}", getFieldLabel(field).toLowerCase())}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {localize(
              "tasks.customizeBoard.valuesNote",
              "Select which specific values to display as {axis}s. Only selected values will appear on your board.",
            ).replace("{axis}", keyPrefix)}
          </p>
        </div>
      )}
    </div>
  );
}
