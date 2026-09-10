"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { CustomFieldDefinition, CustomFieldValue, CustomFieldValues } from '@/lib/types';
import { readJsonOrFallback } from '../../lib/response-json';
import { getCustomFieldDate, getCustomFieldStringArray, getCustomFieldTextInputValue } from '@/lib/customFieldUtils';

interface HeadcountCustomFieldDisplayProps {
  customFields: CustomFieldValues;
  positionId: string;
}

export function HeadcountCustomFieldDisplay({ 
  customFields, 
  positionId 
}: HeadcountCustomFieldDisplayProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomFieldDefinitions();
  }, []);

  const fetchCustomFieldDefinitions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/custom-field-definitions?model=Headcount');
      if (response.ok) {
        const definitions = await readJsonOrFallback<CustomFieldDefinition[]>(response, []);
        setFieldDefinitions(definitions.filter((def) => def.showInHeadcountDetail));
      }
    } catch (error) {
      console.error('Error fetching custom field definitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (definition: CustomFieldDefinition, value: CustomFieldValue) => {
    if (!value) return null;

    switch (definition.field_type) {
      case 'boolean':
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );

      case 'date':
        return (
          <span className="text-sm text-muted-foreground">
            {getCustomFieldDate(value) ? format(getCustomFieldDate(value) as Date, 'MMM dd, yyyy') : getCustomFieldTextInputValue(value)}
          </span>
        );

      case 'select_single':
        const option = definition.options?.find(opt => opt.value === value);
        return (
          <Badge variant="outline" className="text-xs">
            {option?.label || value}
          </Badge>
        );

      case 'select_multiple':
        if (Array.isArray(value)) {
          const selectedValues = getCustomFieldStringArray(value);
          return (
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((v, index) => {
                const option = definition.options?.find(opt => opt.value === v);
                return (
                  <Badge key={index} variant="outline" className="text-xs">
                    {option?.label || v}
                  </Badge>
                );
              })}
            </div>
          );
        }
        return null;

      case 'number':
        return (
          <span className="text-sm font-medium">
            {getCustomFieldTextInputValue(value)}
          </span>
        );

      case 'textarea':
        return (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {getCustomFieldTextInputValue(value)}
          </span>
        );

      default:
        return (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {getCustomFieldTextInputValue(value)}
          </span>
        );
    }
  };

  if (loading || fieldDefinitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {fieldDefinitions.map((definition) => {
        const value = customFields[definition.field_code];
        if (!value) return null;

        return (
          <div key={definition.id} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {definition.label}:
            </span>
            {renderFieldValue(definition, value)}
          </div>
        );
      })}
    </div>
  );
}
