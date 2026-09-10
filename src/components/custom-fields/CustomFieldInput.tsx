"use client";

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getCustomFieldBooleanValue,
  getCustomFieldDate,
  getCustomFieldSelectValue,
  getCustomFieldStringArray,
  getCustomFieldTextInputValue,
} from '@/lib/customFieldUtils';
import { cn } from '@/lib/utils';
import type { CustomFieldInputProps } from './custom-field-edit-types';

export function CustomFieldInput({
  customFields,
  definition,
  onFieldChange,
}: CustomFieldInputProps) {
  const fieldValue = customFields[definition.field_code];
  const fieldId = `custom_${definition.field_code}`;
  const placeholder = `Enter ${definition.label.toLowerCase()}...`;

  switch (definition.field_type) {
    case 'text':
      return (
        <Input
          id={fieldId}
          value={getCustomFieldTextInputValue(fieldValue)}
          onChange={(event) => onFieldChange(definition.field_code, event.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
      );

    case 'textarea':
      return (
        <textarea
          id={fieldId}
          value={getCustomFieldTextInputValue(fieldValue)}
          onChange={(event) => onFieldChange(definition.field_code, event.target.value)}
          placeholder={placeholder}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-gray-100 dark:bg-gray-600 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
      );

    case 'number':
      return (
        <Input
          id={fieldId}
          type="number"
          value={getCustomFieldTextInputValue(fieldValue)}
          onChange={(event) => onFieldChange(definition.field_code, event.target.value ? Number(event.target.value) : null)}
          placeholder={placeholder}
          className="w-full"
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={fieldId}
            checked={getCustomFieldBooleanValue(fieldValue)}
            onCheckedChange={(checked) => onFieldChange(definition.field_code, checked === true)}
          />
          <Label htmlFor={fieldId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {definition.label}
          </Label>
        </div>
      );

    case 'date':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !fieldValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getCustomFieldDate(fieldValue) ? format(getCustomFieldDate(fieldValue) as Date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={getCustomFieldDate(fieldValue)}
              onSelect={(date) => onFieldChange(definition.field_code, date ? date.toISOString() : null)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );

    case 'select_single':
      return (
        <Select value={getCustomFieldSelectValue(fieldValue)} onValueChange={(value) => onFieldChange(definition.field_code, value)}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${definition.label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {definition.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'select_multiple':
      return (
        <div className="space-y-2">
          {definition.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${fieldId}_${option.value}`}
                checked={Array.isArray(fieldValue) && fieldValue.includes(option.value)}
                onCheckedChange={(checked) => {
                  const currentValues = getCustomFieldStringArray(fieldValue);
                  if (checked) {
                    onFieldChange(definition.field_code, [...currentValues, option.value]);
                  } else {
                    onFieldChange(definition.field_code, currentValues.filter(value => value !== option.value));
                  }
                }}
              />
              <Label htmlFor={`${fieldId}_${option.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <Input
          id={fieldId}
          value={getCustomFieldTextInputValue(fieldValue)}
          onChange={(event) => onFieldChange(definition.field_code, event.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
      );
  }
}
