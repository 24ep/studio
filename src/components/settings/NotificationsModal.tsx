import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, BellRing } from 'lucide-react';
import NotificationsForm from './NotificationsForm';

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

interface NotificationsModalProps {
  onNotificationUpdate?: (notification: NotificationSetting) => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ onNotificationUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (data: NotificationSetting) => {
    if (onNotificationUpdate) {
      onNotificationUpdate(data);
    }
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="mb-4"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Notification Setting
      </Button>

      <NotificationsForm
        open={isOpen}
        notification={null}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default NotificationsModal; 