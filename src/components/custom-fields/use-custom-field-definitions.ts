"use client";

import { useEffect, useState } from 'react';

import type { CustomFieldDefinition } from '@/lib/types';
import { fetchCustomFieldsForSection } from '@/lib/customFieldUtils';

export function useCustomFieldDefinitions({
  modelName,
  section,
  refreshTrigger,
}: {
  modelName: 'Applicant' | 'Position' | 'User' | 'Headcount';
  section: string;
  refreshTrigger?: number;
}) {
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFieldDefinitions = async () => {
      try {
        setLoading(true);
        setError(null);
        const fields = await fetchCustomFieldsForSection(modelName, section);
        setFieldDefinitions(fields);
      } catch (err) {
        console.error('Failed to load custom field definitions:', err);
        setError('Failed to load custom fields');
      } finally {
        setLoading(false);
      }
    };

    void loadFieldDefinitions();
  }, [modelName, section, refreshTrigger]);

  return {
    error,
    fieldDefinitions,
    loading,
  };
}
