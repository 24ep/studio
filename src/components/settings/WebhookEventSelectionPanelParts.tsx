import { CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { WEBHOOK_EVENT_CATEGORIES } from './webhook-management-data';
import {
  countSelectedWebhookCategoryEvents,
  findWebhookEventById,
} from './webhook-management-utils';

type WebhookEventCategory = (typeof WEBHOOK_EVENT_CATEGORIES)[number];
type WebhookEvent = WebhookEventCategory['events'][number];

interface WebhookEventCategoryCardProps {
  categoryConfig: WebhookEventCategory;
  selectedEvents: string[];
  onClearCategory: (events: WebhookEvent[]) => void;
  onSelectCategory: (events: WebhookEvent[]) => void;
  onToggleEvent: (eventId: string) => void;
}

export function WebhookEventCategoryCard({
  categoryConfig,
  selectedEvents,
  onClearCategory,
  onSelectCategory,
  onToggleEvent,
}: WebhookEventCategoryCardProps) {
  const { category, color, events, icon } = categoryConfig;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-1.5 ${color} text-white`}>{icon}</div>
          <span className="text-sm font-semibold">{category}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectCategory(events)}
            className="h-6 px-2 text-xs"
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClearCategory(events)}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
          <Badge variant="outline" className="text-xs">
            {countSelectedWebhookCategoryEvents(selectedEvents, events)}/{events.length}
          </Badge>
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {events.map((event) => (
          <WebhookEventCheckboxRow
            key={event.id}
            event={event}
            isSelected={selectedEvents.includes(event.id)}
            onToggleEvent={onToggleEvent}
          />
        ))}
      </div>
    </div>
  );
}

export function SelectedWebhookEventsSummary({ selectedEvents }: { selectedEvents: string[] }) {
  return (
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
      <div className="mb-2 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Selected Events ({selectedEvents.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {selectedEvents.slice(0, 4).map(eventId => {
          const event = findWebhookEventById(WEBHOOK_EVENT_CATEGORIES, eventId);
          return (
            <Badge
              key={eventId}
              variant="secondary"
              className="bg-green-100 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              {event?.label || eventId}
            </Badge>
          );
        })}
        {selectedEvents.length > 4 && (
          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
            +{selectedEvents.length - 4} more
          </Badge>
        )}
      </div>
    </div>
  );
}

function WebhookEventCheckboxRow({
  event,
  isSelected,
  onToggleEvent,
}: {
  event: WebhookEvent;
  isSelected: boolean;
  onToggleEvent: (eventId: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleEvent(event.id)}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{event.label}</span>
          <Badge variant="outline" className="font-mono text-xs">
            {event.id}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{event.description}</p>
      </div>
    </label>
  );
}
