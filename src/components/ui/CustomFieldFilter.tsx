"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ApplicantCustomFieldFilterValue, CustomFieldDefinition } from '@/lib/types';

interface CustomFieldFilterProps {
  definition: CustomFieldDefinition;
  value: ApplicantCustomFieldFilterValue;
  onChange: (value: ApplicantCustomFieldFilterValue) => void;
  className?: string;
}

function getTextFilterValue(value: ApplicantCustomFieldFilterValue): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function getDateFilterValue(value: ApplicantCustomFieldFilterValue): Date | undefined {
  return value instanceof Date || typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : undefined;
}

export function CustomFieldFilter({ 
  definition, 
  value, 
  onChange, 
  className 
}: CustomFieldFilterProps) {
  const renderFilterInput = () => {
    switch (definition.field_type) {
      case 'text':
      case 'textarea':
        return (
          <Input
            value={getTextFilterValue(value)}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={`Filter by ${definition.label.toLowerCase()}...`}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={getTextFilterValue(value)}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={`Filter by ${definition.label.toLowerCase()}...`}
            className="w-full"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${definition.field_code}-true`}
              checked={value === true}
              onCheckedChange={(checked) => onChange(checked ? true : null)}
            />
            <Label htmlFor={`${definition.field_code}-true`}>Yes</Label>
            <Checkbox
              id={`${definition.field_code}-false`}
              checked={value === false}
              onCheckedChange={(checked) => onChange(checked ? false : null)}
            />
            <Label htmlFor={`${definition.field_code}-false`}>No</Label>
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
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateFilterValue(value) ? format(getDateFilterValue(value) as Date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={getDateFilterValue(value)}
                onSelect={(date) => onChange(date ? date.toISOString() : null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'select_single':
        return (
          <Select value={getTextFilterValue(value)} onValueChange={(val) => onChange(val || null)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${definition.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
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
            {definition.options?.map((option) => {
              const currentValues = Array.isArray(value) ? value.map(String) : [];

              return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${definition.field_code}-${option.value}`}
                  checked={currentValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${definition.field_code}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            );
            })}
          </div>
        );

      default:
        return (
          <Input
            value={getTextFilterValue(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Filter by ${definition.label.toLowerCase()}...`}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {definition.label}
        {definition.is_required && (
          <span className="text-destructive ml-1">*</span>
        )}
      </Label>
      {renderFilterInput()}
    </div>
  );
}
