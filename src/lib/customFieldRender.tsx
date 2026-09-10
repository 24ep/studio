import React from 'react';

import type { CustomFieldDefinition, CustomFieldValue } from './types';
import {
  getCustomFieldDate,
  getCustomFieldTextInputValue,
} from './customFieldValues';

export function renderCustomFieldValue(
  definition: CustomFieldDefinition,
  value: CustomFieldValue,
): React.ReactNode {
  if (!value) return <span className="text-muted-foreground text-sm">-</span>;

  switch (definition.field_type) {
    case 'boolean':
      return (
        <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-gray-500'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );

    case 'date':
      try {
        const date = getCustomFieldDate(value);
        if (!date) throw new Error('Invalid custom field date');
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        );
      } catch {
        return <span className="text-sm text-muted-foreground">{getCustomFieldTextInputValue(value)}</span>;
      }

    case 'select_single': {
      const option = definition.options?.find(opt => opt.value === value);
      return (
        <span className="text-sm font-medium">
          {option?.label || value}
        </span>
      );
    }

    case 'select_multiple':
      if (Array.isArray(value)) {
        const labels = value.map(v => {
          const option = definition.options?.find(opt => opt.value === v);
          return option?.label || v;
        });
        return (
          <div className="text-sm">
            {labels.join(', ')}
          </div>
        );
      }
      return <span className="text-sm text-muted-foreground">-</span>;

    case 'number':
      return (
        <span className="text-sm font-medium">
          {value}
        </span>
      );

    case 'textarea':
      return (
        <div className="text-sm text-muted-foreground max-w-xs">
          <div className="line-clamp-3" title={getCustomFieldTextInputValue(value)}>
            {getCustomFieldTextInputValue(value)}
          </div>
        </div>
      );

    default:
      return (
        <span className="text-sm text-muted-foreground max-w-xs truncate" title={getCustomFieldTextInputValue(value)}>
          {getCustomFieldTextInputValue(value)}
        </span>
      );
  }
}
