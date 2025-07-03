// src/app/settings/notifications/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, ServerCrash } from 'lucide-react';
import NotificationsTable from '@/components/settings/NotificationsTable';
import NotificationsForm from '@/components/settings/NotificationsForm';
import NotificationsModal from '@/components/settings/NotificationsModal';

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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationSetting | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array of notifications');
      }
      
      setNotifications(data);
    } catch (e: any) {
      const errorMessage = e.message || 'Failed to fetch notifications';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchNotifications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (notification: NotificationSetting | null = null) => {
    setEditingNotification(notification);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingNotification(null);
  };

  const handleSubmit = async (data: NotificationSetting) => {
    setIsSaving(true);
    try {
      const url = data.id ? `/api/settings/notifications/${data.id}` : '/api/settings/notifications';
      const method = data.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save notification setting');
      }

      toast.success(`Notification setting ${data.id ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      setEditingNotification(null);
      fetchNotifications();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (notificationId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/settings/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification setting');
      }

      toast.success(`Notification ${isEnabled ? 'enabled' : 'disabled'}`);
      fetchNotifications();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddNewNotification = async (data: NotificationSetting) => {
    await handleSubmit(data);
  };

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Notifications</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={fetchNotifications} className="btn-hover-primary-gradient">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="shadow-lg">
        <div className="flex items-center text-2xl">
          <BellRing className="mr-3 h-6 w-6 text-primary" /> Notification Settings
        </div>
        <div className="p-4">
          <NotificationsModal onNotificationUpdate={handleAddNewNotification} />
          
          <NotificationsTable
            notifications={notifications}
            isLoading={isLoading}
            onEdit={handleModalOpen}
            onToggle={handleToggle}
          />
          
          <NotificationsForm
            open={isModalOpen}
            notification={editingNotification}
            onClose={handleModalClose}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
