"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Pencil, Search, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  SortableNativeHeader,
  type SortDirection,
  type SortValueResolverMap,
} from '@/components/ui/sortable-table';
import {
  CUSTOM_FIELD_TYPES,
  type CustomFieldDefinition,
  type CustomFieldOption,
  type CustomFieldType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export interface PlatformDataModelField {
  defaultValue?: string;
  isList: boolean;
  isOptional: boolean;
  isSystem: boolean;
  label: string;
  name: string;
  nativeType?: string;
  type: string;
}

export interface PlatformDataModel {
  customFields: CustomFieldDefinition[];
  fields: PlatformDataModelField[];
  label: string;
  name: string;
}

export type FieldFormState = {
  allowCustomOptions: boolean;
  field_code: string;
  field_type: CustomFieldType;
  is_required: boolean;
  label: string;
  model_name: string;
  optionsText: string;
  sort_order: number;
};

export type FieldManagementRow = {
  kind: 'system' | 'custom';
  field: PlatformDataModelField | CustomFieldDefinition;
};

export const EMPTY_FIELD_FORM: FieldFormState = {
  allowCustomOptions: false,
  field_code: '',
  field_type: 'text',
  is_required: false,
  label: '',
  model_name: '',
  optionsText: '',
  sort_order: 0,
};

export function buildFieldRowsSortValueResolvers(
  customFieldMap: Map<string, CustomFieldDefinition>,
): SortValueResolverMap<FieldManagementRow> {
  return {
    field: row => row.kind === 'system'
      ? `${row.field.label} ${(row.field as PlatformDataModelField).name}`
      : `${row.field.label} ${(row.field as CustomFieldDefinition).field_code}`,
    type: row => row.kind === 'system'
      ? formatSystemType(row.field as PlatformDataModelField)
      : formatFieldType((row.field as CustomFieldDefinition).field_type),
    source: row => (row.kind === 'system' ? 'System' : 'Dynamic'),
    rules: row => {
      if (row.kind === 'system') {
        const field = row.field as PlatformDataModelField;
        return [
          field.isOptional ? 'Optional' : 'Required',
          field.isList ? 'List' : null,
          field.defaultValue ? `Default: ${field.defaultValue}` : null,
        ].filter(Boolean).join(' | ');
      }

      const field = row.field as CustomFieldDefinition;
      return [
        field.is_required ? 'Required' : 'Optional',
        field.options?.length ? `${field.options.length} options` : null,
        customFieldMap.has(field.field_code) ? 'Overrides system code' : null,
      ].filter(Boolean).join(' | ');
    },
  };
}

export function FieldManagementModelSidebar({
  activeModelName,
  models,
  query,
  onQueryChange,
  onSelectModel,
}: {
  activeModelName?: string;
  models: PlatformDataModel[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelectModel: (modelName: string) => void;
}) {
  return (
    <aside className="min-h-0 rounded-md border bg-card">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search models"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
          />
        </div>
      </div>
      <div className="h-[calc(100%-57px)] overflow-y-auto p-2">
        {models.map(model => (
          <button
            key={model.name}
            type="button"
            onClick={() => onSelectModel(model.name)}
            className={cn(
              'mb-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors',
              model.name === activeModelName
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="min-w-0 truncate">{model.label}</span>
            <span className="ml-2 shrink-0 text-xs opacity-80">{model.fields.length + model.customFields.length}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export function FieldManagementFieldForm({
  editingField,
  form,
  models,
  onClose,
  onFormChange,
  onSave,
}: {
  editingField: CustomFieldDefinition | null;
  form: FieldFormState;
  models: PlatformDataModel[];
  onClose: () => void;
  onFormChange: Dispatch<SetStateAction<FieldFormState>>;
  onSave: () => void;
}) {
  return (
    <section className="border-b bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{editingField ? 'Update Dynamic Field' : 'Add Dynamic Field'}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <FieldControl label="Model">
          <Select value={form.model_name} onValueChange={value => onFormChange(current => ({ ...current, model_name: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent selectId="field-management-model-select">
              {models.map(model => (
                <SelectItem key={model.name} value={model.name}>{model.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldControl>
        <FieldControl label="Field Code">
          <Input
            value={form.field_code}
            onChange={event => onFormChange(current => ({ ...current, field_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }))}
            placeholder="FIELD_CODE"
          />
        </FieldControl>
        <FieldControl label="Label">
          <Input
            value={form.label}
            onChange={event => onFormChange(current => ({ ...current, label: event.target.value }))}
            placeholder="Display label"
          />
        </FieldControl>
        <FieldControl label="Type">
          <Select value={form.field_type} onValueChange={value => onFormChange(current => ({ ...current, field_type: value as CustomFieldType }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent selectId="field-management-type-select">
              {CUSTOM_FIELD_TYPES.map(type => (
                <SelectItem key={type} value={type}>{formatFieldType(type)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldControl>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[160px_160px_minmax(0,1fr)_auto]">
        <FieldControl label="Sort Order">
          <Input
            type="number"
            value={form.sort_order}
            onChange={event => onFormChange(current => ({ ...current, sort_order: Number(event.target.value) }))}
          />
        </FieldControl>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">Required</label>
          <Switch checked={form.is_required} onCheckedChange={value => onFormChange(current => ({ ...current, is_required: value }))} />
        </div>
        <FieldControl label="Options">
          <Textarea
            value={form.optionsText}
            onChange={event => onFormChange(current => ({ ...current, optionsText: event.target.value }))}
            placeholder="One option per line, e.g. active:Active"
          />
        </FieldControl>
        <div className="flex items-end">
          <Button onClick={onSave}>{editingField ? 'Update Field' : 'Create Field'}</Button>
        </div>
      </div>
    </section>
  );
}

export function FieldManagementTable({
  customFieldMap,
  rows,
  sortColumn,
  sortDirection,
  onDeleteField,
  onEditField,
  onSort,
}: {
  customFieldMap: Map<string, CustomFieldDefinition>;
  rows: FieldManagementRow[];
  sortColumn: string | null;
  sortDirection: SortDirection;
  onDeleteField: (field: CustomFieldDefinition) => void;
  onEditField: (field: CustomFieldDefinition) => void;
  onSort: (column: string | null, direction: SortDirection) => void;
}) {
  return (
    <div className="h-[calc(100%-81px)] overflow-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="sticky top-0 z-10 border-b bg-muted/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <SortableNativeHeader column="field" label="Field" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} className="px-4 py-3 font-medium" />
            <SortableNativeHeader column="type" label="Type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} className="px-4 py-3 font-medium" />
            <SortableNativeHeader column="source" label="Source" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} className="px-4 py-3 font-medium" />
            <SortableNativeHeader column="rules" label="Rules" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} className="px-4 py-3 font-medium" />
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const key = row.kind === 'system'
              ? (row.field as PlatformDataModelField).name
              : (row.field as CustomFieldDefinition).id;
            const systemField = row.kind === 'system' ? row.field as PlatformDataModelField : null;
            const customField = row.kind === 'custom' ? row.field as CustomFieldDefinition : null;
            const hasDuplicateCustomField = Boolean(systemField && customFieldMap.has(systemField.name));

            return (
              <tr key={`${row.kind}-${key}`} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.field.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {systemField ? systemField.name : customField?.field_code}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {systemField ? formatSystemType(systemField) : customField ? formatFieldType(customField.field_type) : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded px-2 py-1 text-xs font-medium',
                    systemField
                      ? 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                  )}>
                    {systemField ? 'System' : 'Dynamic'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {systemField
                    ? [
                        systemField.isOptional ? 'Optional' : 'Required',
                        systemField.isList ? 'List' : null,
                        systemField.defaultValue ? `Default: ${systemField.defaultValue}` : null,
                      ].filter(Boolean).join(' | ')
                    : customField
                      ? [
                          customField.is_required ? 'Required' : 'Optional',
                          customField.options?.length ? `${customField.options.length} options` : null,
                          hasDuplicateCustomField ? 'Overrides system code' : null,
                        ].filter(Boolean).join(' | ') || 'Optional'
                      : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  {customField ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEditField(customField)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDeleteField(customField)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FieldControl({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function formatFieldType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

export function formatSystemType(field: PlatformDataModelField) {
  const suffixes = [
    field.nativeType ? field.nativeType : null,
    field.isList ? 'List' : null,
  ].filter(Boolean);

  return suffixes.length ? `${field.type} (${suffixes.join(', ')})` : field.type;
}

export function optionsToText(options: CustomFieldOption[]) {
  return options.map(option => `${option.value}:${option.label}`).join('\n');
}

export function parseOptions(value: string): CustomFieldOption[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [optionValue, ...labelParts] = line.split(':');
      const label = labelParts.join(':').trim() || optionValue.trim();
      return {
        value: optionValue.trim(),
        label,
        sortOrder: index,
        isActive: true,
      };
    });
}
