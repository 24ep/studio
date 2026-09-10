'use client';

import { Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  WebhookLogsFilterKey,
  WebhookLogsFiltersState,
} from './webhook-delivery-logs-types';
import { WEBHOOK_LOG_EVENT_FILTER_OPTIONS } from './webhook-delivery-logs-utils';

interface WebhookLogsFiltersProps {
  filters: WebhookLogsFiltersState;
  onFilterChange: (key: WebhookLogsFilterKey, value: string) => void;
  onClearFilters: () => void;
}

export function WebhookLogsFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: WebhookLogsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={filters.event_type || 'all'}
              onValueChange={value => onFilterChange('event_type', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="event_type">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {WEBHOOK_LOG_EVENT_FILTER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="success">Status</Label>
            <Select
              value={filters.success || 'all'}
              onValueChange={value => onFilterChange('success', value === 'all' ? '' : value)}
            >
              <SelectTrigger id="success">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Success</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={filters.start_date}
              onChange={event => onFilterChange('start_date', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={filters.end_date}
              onChange={event => onFilterChange('end_date', event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

