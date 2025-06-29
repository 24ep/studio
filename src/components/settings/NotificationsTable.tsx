import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Edit, BellRing, Loader2, Mail, Webhook } from 'lucide-react';
import type { NotificationEventWithSettings } from '@/lib/types';

interface NotificationSetting {
  id: string;
  eventId: string;
  channelId: string;
  isEnabled: boolean;
  configuration?: { webhookUrl?: string } | null;
  eventKey?: string;
  eventLabel?: string;
  channelKey?: 'email' | 'webhook';
  channelLabel?: string;
}

interface NotificationsTableProps {
  notifications: NotificationSetting[];
  isLoading: boolean;
  onEdit: (notification: NotificationSetting) => void;
  onToggle?: (notificationId: string, isEnabled: boolean) => void;
}

const NotificationsTable: React.FC<NotificationsTableProps> = ({ 
  notifications, 
  isLoading, 
  onEdit, 
  onToggle 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BellRing className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Notification Settings</h3>
            <p className="text-muted-foreground mb-4">
              No notification settings have been configured yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChannelIcon = (channelKey?: string) => {
    switch (channelKey) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <BellRing className="h-4 w-4" />;
    }
  };

  const getEventCategory = (eventKey?: string): string => {
    if (!eventKey) return 'General';
    if (eventKey.includes('candidate')) return 'Candidate Events';
    if (eventKey.includes('position')) return 'Position Events';
    if (eventKey.includes('user')) return 'User Events';
    if (eventKey.includes('system')) return 'System Events';
    return 'General';
  };

  // Group notifications by event category
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const category = getEventCategory(notification.eventKey);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notification);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{notification.eventLabel || notification.eventKey || 'Unknown Event'}</span>
                        {notification.eventKey && (
                          <span className="text-xs text-muted-foreground">{notification.eventKey}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(notification.channelKey)}
                        <span>{notification.channelLabel || notification.channelKey || 'Unknown Channel'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={notification.isEnabled}
                          onCheckedChange={(checked) => onToggle?.(notification.id, checked)}
                          aria-label="Toggle notification"
                        />
                        <Badge variant={notification.isEnabled ? 'default' : 'secondary'}>
                          {notification.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {notification.configuration?.webhookUrl ? (
                        <div className="max-w-xs">
                          <div className="text-sm font-mono bg-muted px-2 py-1 rounded truncate" 
                               title={notification.configuration.webhookUrl}>
                            {notification.configuration.webhookUrl}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(notification)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsTable; 