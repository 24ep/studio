"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import PreferencesTable from '@/components/settings/PreferencesTable';
import PreferencesForm from '@/components/settings/PreferencesForm';
import PreferencesModal from '@/components/settings/PreferencesModal';

// Define the types matching your preferences schema
interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: string;
}

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<UserPreference | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/user-preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      const data = await response.json();
      setPreferences(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPreferences();
    } else if (status === 'unauthenticated') {
      signIn();
    }
  }, [status, fetchPreferences]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModalOpen = (preference: UserPreference | null = null) => {
    setEditingPreference(preference);
    setIsModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPreference(null);
  };
  const handleSubmit = async (data: any) => {
    // Implement submit logic
    setIsModalOpen(false);
    fetchPreferences();
  };

  return (
    <div>
      <PreferencesTable
        preferences={preferences}
        isLoading={isLoading}
        onEdit={handleModalOpen}
      />
      <PreferencesForm
        open={isModalOpen}
        preference={editingPreference}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
      />
      <PreferencesModal />
    </div>
  );
}

    