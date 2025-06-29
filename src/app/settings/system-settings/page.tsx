"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import SystemSettingsTable from '@/components/settings/SystemSettingsTable';
import SystemSettingsForm from '@/components/settings/SystemSettingsForm';
import SystemSettingsModal from '@/components/settings/SystemSettingsModal';

// Define the types matching your system settings schema
interface SystemSetting {
  key: string;
  value: string | null;
  updatedAt?: string;
}

export default function SystemSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/system-settings');
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      const data = await response.json();
      
      // Convert object response to array format for components
      const settingsArray = Object.entries(data).map(([key, value]) => ({
        key,
        value: value as string | null,
        updatedAt: new Date().toISOString() // API doesn't return updatedAt for each setting
      }));
      
      setSettings(settingsArray);
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

  const handleSubmit = async (data: SystemSetting[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update system settings');
      }

      toast.success('System settings updated successfully');
      setIsModalOpen(false);
      fetchSettings();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewSetting = async (data: SystemSetting[]) => {
    await handleSubmit(data);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600">Manage application-wide settings and configurations.</p>
      </div>

      <SystemSettingsModal onSettingsUpdate={handleAddNewSetting} />

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
        isSaving={isSaving}
      />
    </div>
  );
} 