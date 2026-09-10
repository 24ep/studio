import { Database, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import type { FieldMapping } from './webhook-body-customization-types';
import { TRANSFORM_OPTIONS } from './webhook-body-customization-types';

type FieldMappingUpdater = (field: keyof FieldMapping, value: unknown) => void;

interface WebhookFieldMappingRowProps {
  mapping: FieldMapping;
  onRemove: () => void;
  onUpdate: FieldMappingUpdater;
}

export function WebhookFieldMappingRow({
  mapping,
  onRemove,
  onUpdate,
}: WebhookFieldMappingRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
      <div className="flex-1">
        <Label className="text-xs font-medium">Source Field</Label>
        <Input
          value={mapping.source_field}
          onChange={(event) => onUpdate('source_field', event.target.value)}
          placeholder="e.g., user.name"
          className="mt-1"
        />
      </div>
      <div className="flex-1">
        <Label className="text-xs font-medium">Target Field</Label>
        <Input
          value={mapping.target_field}
          onChange={(event) => onUpdate('target_field', event.target.value)}
          placeholder="e.g., name"
          className="mt-1"
        />
      </div>
      <div className="w-32">
        <Label className="text-xs font-medium">Transform</Label>
        <Select
          value={mapping.transform || 'none'}
          onValueChange={(value) => onUpdate('transform', value === 'none' ? undefined : value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {TRANSFORM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function WebhookAvailableFieldsPanel({
  fields,
  selectedEvent,
}: {
  fields: string[];
  selectedEvent: string;
}) {
  return (
    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-start gap-2">
        <Database className="h-4 w-4 text-green-600 mt-0.5" />
        <div className="text-sm text-green-700 dark:text-green-300">
          <p className="font-medium mb-1">Available Fields for {selectedEvent}:</p>
          <div className="flex flex-wrap gap-1">
            {fields.map((field) => (
              <Badge key={field} variant="outline" className="text-xs">
                {field}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
