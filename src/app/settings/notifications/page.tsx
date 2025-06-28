// src/app/settings/notifications/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import NotificationsTable from '@/components/settings/NotificationsTable';
import NotificationsForm from '@/components/settings/NotificationsForm';
import NotificationsModal from '@/components/settings/NotificationsModal';

// Define the types matching your notifications schema
interface NotificationSetting {
  id: string;
  type: string;
  enabled: boolean;
  channel: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationSetting | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
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
  const handleSubmit = async (data: any) => {
    // Implement submit logic
    setIsModalOpen(false);
    fetchNotifications();
  };

  return (
    <div>
      <NotificationsTable
        notifications={notifications}
        isLoading={isLoading}
        onEdit={handleModalOpen}
      />
      <NotificationsForm
        open={isModalOpen}
        notification={editingNotification}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
      <NotificationsModal />
    </div>
  );
}
