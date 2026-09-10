'use client';

import { Layers } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WEBHOOK_EVENT_CATEGORIES } from './webhook-management-data';
import {
  addWebhookCategoryEvents,
  getAllWebhookEventIds,
  removeWebhookCategoryEvents,
  toggleWebhookEvent,
} from './webhook-management-utils';
import type { WebhookFormPatchHandler } from './WebhookFormDialogTypes';
import {
  SelectedWebhookEventsSummary,
  WebhookEventCategoryCard,
} from './WebhookEventSelectionPanelParts';

interface WebhookEventSelectionPanelProps {
  selectedEvents: string[];
  onUpdateFormData: WebhookFormPatchHandler;
}

export function WebhookEventSelectionPanel({
  selectedEvents,
  onUpdateFormData,
}: WebhookEventSelectionPanelProps) {
  const selectAllEvents = () => onUpdateFormData({
    events: getAllWebhookEventIds(WEBHOOK_EVENT_CATEGORIES),
  });
  const clearAllEvents = () => onUpdateFormData({ events: [] });
  const selectCategoryEvents = (events: { id: string }[]) => onUpdateFormData({
    events: addWebhookCategoryEvents(selectedEvents, events),
  });
  const clearCategoryEvents = (events: { id: string }[]) => onUpdateFormData({
    events: removeWebhookCategoryEvents(selectedEvents, events),
  });
  const toggleEvent = (eventId: string) => onUpdateFormData({
    events: toggleWebhookEvent(selectedEvents, eventId),
  });

  return (
    <div className="flex min-h-0 w-full flex-col border-r border-border bg-muted/30 px-6 pb-6 pt-0 lg:w-2/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Layers className="h-5 w-5 text-blue-600" />
          Event Selection
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllEvents}
            className="h-7 px-2 text-xs"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllEvents}
            className="h-7 px-2 text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {selectedEvents.length} events selected
        </Badge>
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
        {WEBHOOK_EVENT_CATEGORIES.map((categoryConfig) => (
          <WebhookEventCategoryCard
            key={categoryConfig.category}
            categoryConfig={categoryConfig}
            selectedEvents={selectedEvents}
            onClearCategory={clearCategoryEvents}
            onSelectCategory={selectCategoryEvents}
            onToggleEvent={toggleEvent}
          />
        ))}
      </div>

      {selectedEvents.length > 0 && (
        <SelectedWebhookEventsSummary selectedEvents={selectedEvents} />
      )}
    </div>
  );
}
