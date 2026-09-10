import {
  Activity,
  Circle,
  MessageSquare,
  Users,
} from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';

import {
  formatTimestamp,
  type CollaborationEvent,
} from './realtime-collaboration-utils';
import { RealtimeSectionHeading } from './realtime-collaboration-section-heading';

export function CollaborationEventsSection({ events }: { events: CollaborationEvent[] }) {
  return (
    <div>
      <RealtimeSectionHeading icon={<Activity className="w-4 h-4" />} label="Recent Activity" count={events.length} />
      <ScrollArea className="h-24">
        <div className="space-y-2">
          {events.map(event => (
            <CollaborationEventRow key={event.id} event={event} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function CollaborationEventRow({ event }: { event: CollaborationEvent }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
      <div className="mt-1">
        <EventIcon type={event.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">
          {event.userName}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {event.type.replace('_', ' ')}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTimestamp(event.timestamp)}
        </div>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'Applicant_update':
      return <Users className="w-4 h-4" />;
    case 'position_update':
      return <Activity className="w-4 h-4" />;
    case 'status_change':
      return <Circle className="w-4 h-4" />;
    case 'comment':
      return <MessageSquare className="w-4 h-4" />;
    case 'assignment':
      return <Users className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}
