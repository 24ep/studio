'use client';

import { Palette, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomHeaderRow } from './webhook-management-utils';

interface WebhookCustomHeadersFieldsProps {
  customHeaders: CustomHeaderRow[];
  onAddCustomHeader: () => void;
  onRemoveCustomHeader: (index: number) => void;
  onUpdateCustomHeader: (index: number, field: keyof CustomHeaderRow, value: string) => void;
}

export function WebhookCustomHeadersFields({
  customHeaders,
  onAddCustomHeader,
  onRemoveCustomHeader,
  onUpdateCustomHeader,
}: WebhookCustomHeadersFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4" />
          Custom Headers
        </h4>
        <Button type="button" variant="outline" size="sm" onClick={onAddCustomHeader}>
          <Plus className="mr-1 h-3 w-3" />
          Add Header
        </Button>
      </div>

      <div className="space-y-2">
        {customHeaders.map((header, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Header name"
              value={header.key}
              onChange={event => onUpdateCustomHeader(index, 'key', event.target.value)}
              className="flex-1"
            />
            <Input
              type="text"
              placeholder="Header value"
              value={header.value}
              onChange={event => onUpdateCustomHeader(index, 'value', event.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveCustomHeader(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

