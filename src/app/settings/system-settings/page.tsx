"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import SystemSettingsTable from '@/components/settings/SystemSettingsTable';
import SystemSettingsForm from '@/components/settings/SystemSettingsForm';
import SystemSettingsModal from '@/components/settings/SystemSettingsModal';

// Define the types matching your system settings schema
interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function SystemSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchSettings]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (setting: SystemSetting | null = null) => {
    setEditingSetting(setting);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSetting(null);
  };
  const handleSubmit = async (data: any) => {
    // Implement submit logic
    setIsModalOpen(false);
    fetchSettings();
  };

  return (
    <div>
      <SystemSettingsTable
        settings={settings}
        isLoading={isLoading}
        onEdit={handleModalOpen}
      />
      <SystemSettingsForm
        open={isModalOpen}
        setting={editingSetting}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
      <SystemSettingsModal />
    </div>
  );
} 